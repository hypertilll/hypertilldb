package com.hypertill.db.jsi;

import android.app.Application;

// Public interface to JSI-based Hypertill
public class HypertillJSI {
    public static void onTrimMemory(int level) {
      // TODO: Unimplemented
    }

    public static void provideSyncJson(int id, byte[] json) {
        JSIInstaller.provideSyncJson(id, json);
    }

    public static void onCatalystInstanceDestroy() {
        JSIInstaller.destroy();
    }
}
