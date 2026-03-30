package com.cph5236.simpleweatherservice

import android.content.Context
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

const val PREFS_NAME = "sws_widget_prefs"

@CapacitorPlugin(name = "WidgetConfig")
class WidgetConfigPlugin : Plugin() {

    @PluginMethod
    fun setWidgetLocation(call: PluginCall) {
        val name = call.getString("name") ?: return call.reject("name required")
        val lat = call.getFloat("lat") ?: return call.reject("lat required")
        val lon = call.getFloat("lon") ?: return call.reject("lon required")
        val country = call.getString("country") ?: return call.reject("country required")
        val admin1 = call.getString("admin1") ?: ""
        val units = call.getString("units") ?: "metric"

        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().apply {
            putString("widget_location_name", name)
            putFloat("widget_location_lat", lat)
            putFloat("widget_location_lon", lon)
            putString("widget_location_country", country)
            putString("widget_location_admin1", admin1)
            putString("widget_units", units)
            putBoolean("widget_configured", true)
            apply()
        }

        // Kick off an immediate refresh so the widget shows new data right away.
        WeatherWidgetWorker.enqueueImmediate(context)

        call.resolve()
    }

    @PluginMethod
    fun getWidgetLocation(call: PluginCall) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val configured = prefs.getBoolean("widget_configured", false)

        val result = JSObject()
        if (!configured) {
            result.put("configured", false)
            call.resolve(result)
            return
        }

        result.put("configured", true)
        result.put("name", prefs.getString("widget_location_name", ""))
        result.put("lat", prefs.getFloat("widget_location_lat", 0f))
        result.put("lon", prefs.getFloat("widget_location_lon", 0f))
        result.put("country", prefs.getString("widget_location_country", ""))
        result.put("admin1", prefs.getString("widget_location_admin1", ""))
        result.put("units", prefs.getString("widget_units", "metric"))
        call.resolve(result)
    }

    @PluginMethod
    fun setWidgetBackground(call: PluginCall) {
        val color = call.getString("color") ?: return call.reject("color required")
        val alpha = call.getInt("alpha") ?: 100
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().apply {
            putString("widget_bg_color", color)
            putInt("widget_bg_alpha", alpha)
            apply()
        }
        WeatherWidgetWorker.enqueueImmediate(context)
        call.resolve()
    }

    @PluginMethod
    fun getWidgetBackground(call: PluginCall) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val color = prefs.getString("widget_bg_color", null)
        val result = JSObject()
        if (color != null) {
            result.put("color", color)
            result.put("alpha", prefs.getInt("widget_bg_alpha", 100))
        }
        call.resolve(result)
    }
}
