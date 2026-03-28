package com.cph5236.simpleweatherservice

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(WidgetConfigPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
