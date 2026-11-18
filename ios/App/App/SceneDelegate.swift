import UIKit
import Capacitor

/// The UIScene life cycle — REQUIRED for apps built with the iOS 27 SDK. Without
/// `UIApplicationSceneManifest` (Info.plist) pointing here, UIKit refuses to
/// launch the app at all ("UIScene life cycle is required for apps built with
/// this SDK"): the build archives, uploads and passes every test, then dies on
/// the first frame. That is exactly how jpc.eats 4.0.0 was rejected by App
/// Review ("The app crashed on launch"). `scripts/ios-launch-smoke.sh` guards it.
///
/// The scene owns the window now (created from the Main storyboard via
/// `UISceneStoryboardFile`). This delegate shares it with AppDelegate and
/// forwards the URL / Universal Link events that scenes receive INSTEAD of the
/// app delegate, so Capacitor's App plugin keeps seeing them.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        (UIApplication.shared.delegate as? AppDelegate)?.window = window
        if let url = connectionOptions.urlContexts.first?.url {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
        }
        if let activity = connectionOptions.userActivities.first {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: activity, restorationHandler: { _ in })
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        guard let url = URLContexts.first?.url else { return }
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
    }
}
