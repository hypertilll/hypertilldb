package com.hypertill.db.jsi;

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = HypertillDBJSIModule.NAME)
public class HypertillDBJSIModule extends ReactContextBaseJavaModule {
  ReactApplicationContext reactContext;
  public static final String NAME = "WMDatabaseJSIBridge";

   public HypertillDBJSIModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public boolean install() {
    try {
      JavaScriptContextHolder jsContext = getReactApplicationContext().getJavaScriptContextHolder();
      JSIInstaller.install(getReactApplicationContext(), jsContext.get());
      Log.i(NAME, "Successfully installed Hypertill DB JSI Bindings!");
      return true;
    } catch (Exception exception) {
      Log.e(NAME, "Failed to install Hypertill DB JSI Bindings!", exception);
      return false;
    }
  }
}