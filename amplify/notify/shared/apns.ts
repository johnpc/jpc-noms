/**
 * APNs delivery via SNS. For each device token we create (idempotently) a
 * platform endpoint on the SNS APNs platform application, then publish the
 * aps payload to it. The platform-application ARN is injected by backend.ts as
 * APNS_PLATFORM_ARN once the Apple push key is wired (see slice-5 notes); until
 * then publish() no-ops so the pipeline is inert but deployable. Mocked in the
 * handler test.
 */
import { SNSClient, CreatePlatformEndpointCommand, PublishCommand } from '@aws-sdk/client-sns';

const sns = new SNSClient({});

const platformArn = (): string | undefined => process.env.APNS_PLATFORM_ARN || undefined;

/** APNs JSON payload wrapped for SNS's APNS transport. */
function apnsMessage(title: string, body: string): string {
  const aps = { aps: { alert: { title, body }, sound: 'default' } };
  return JSON.stringify({
    default: body,
    APNS: JSON.stringify(aps),
    APNS_SANDBOX: JSON.stringify(aps),
  });
}

/** Deliver one notification to a device token. No-op until APNS_PLATFORM_ARN is set. */
export async function pushToToken(token: string, title: string, body: string): Promise<void> {
  const arn = platformArn();
  if (!arn) {
    console.log('APNS_PLATFORM_ARN not set — skipping push (pipeline inert).');
    return;
  }
  const { EndpointArn } = await sns.send(
    new CreatePlatformEndpointCommand({ PlatformApplicationArn: arn, Token: token }),
  );
  if (!EndpointArn) return;
  await sns.send(
    new PublishCommand({
      TargetArn: EndpointArn,
      MessageStructure: 'json',
      Message: apnsMessage(title, body),
    }),
  );
}
