#import "JSIInstaller.h"
#import "Database.h"

extern "C" void installHypertillJSI(RCTCxxBridge *bridge) {
    if (bridge.runtime == nullptr) {
        return;
    }

    jsi::Runtime *runtime = (jsi::Runtime*) bridge.runtime;
    assert(runtime != nullptr);
    hypertilldb::Database::install(runtime);
}
