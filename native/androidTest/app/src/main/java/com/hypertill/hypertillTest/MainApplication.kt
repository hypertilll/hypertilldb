package com.hypertill.hypertillTest

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.shell.MainReactPackage
import com.facebook.soloader.SoLoader
import com.hypertill.db.HypertillDBPackage
import com.hypertill.db.jsi.HypertillDBJSIPackage

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost = object : DefaultReactNativeHost(this) {
        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override fun getPackages(): List<ReactPackage> =
            listOf(MainReactPackage(), NativeModulesPackage(), HypertillDBPackage(), HypertillDBJSIPackage())

        override fun getJSMainModuleName(): String = "src/index.integrationTests.native"
    }

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, false)
    }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(applicationContext, reactNativeHost)
}
