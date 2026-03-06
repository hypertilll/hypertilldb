package com.hypertill.hypertillTest

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.hypertill.db.jsi.HypertillJSI

class MainActivity : ReactActivity() {
    override fun getMainComponentName(): String = "hypertillTest"

    override fun onTrimMemory(level: Int) {
        super.onTrimMemory(level)
        HypertillJSI.onTrimMemory(level)
    }

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
