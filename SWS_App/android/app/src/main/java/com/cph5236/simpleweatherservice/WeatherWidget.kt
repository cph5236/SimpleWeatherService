package com.cph5236.simpleweatherservice

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.util.SizeF
import android.widget.RemoteViews
import androidx.work.WorkManager

class WeatherWidget : AppWidgetProvider() {

    companion object {
        private const val TAG = "WeatherWidget"
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val configured = prefs.getBoolean("widget_configured", false)

            val launchIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context, 0, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

            for (id in appWidgetIds) {
                val views = RemoteViews(context.packageName, R.layout.widget_weather)
                if (!configured) {
                    views.setTextViewText(R.id.widget_location, "Simple Weather")
                    views.setTextViewText(R.id.widget_temp, "--")
                    views.setTextViewText(R.id.widget_description, "Open app to set widget location")
                    views.setTextViewText(R.id.widget_icon, "")
                    views.setTextViewText(R.id.widget_feels_like, "")
                    views.setTextViewText(R.id.widget_humidity, "")
                } else {
                    val locName = prefs.getString("widget_location_name", "") ?: ""
                    views.setTextViewText(R.id.widget_location, locName)
                    views.setTextViewText(R.id.widget_temp, "…")
                    views.setTextViewText(R.id.widget_description, "Refreshing…")
                    views.setTextViewText(R.id.widget_icon, "")
                    views.setTextViewText(R.id.widget_feels_like, "")
                    views.setTextViewText(R.id.widget_humidity, "")
                }
                views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
                appWidgetManager.updateAppWidget(id, views)
            }

            try {
                WeatherWidgetWorker.enqueuePeriodic(context)
                if (configured) {
                    WeatherWidgetWorker.enqueueImmediate(context)
                }
            } catch (e: Exception) {
                Log.w(TAG, "WorkManager not yet initialized", e)
            }
        } catch (e: Exception) {
            Log.e(TAG, "onUpdate failed", e)
        }
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle,
    ) {
        // API 31+ handles resizing automatically via the responsive RemoteViews map
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) return

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        if (!prefs.getBoolean("widget_configured", false)) return

        val temp = prefs.getInt("widget_last_temp", 0)
        val feelsLike = prefs.getInt("widget_last_feels_like", 0)
        val humidity = prefs.getInt("widget_last_humidity", 0)
        val code = prefs.getInt("widget_last_code", 0)
        val locName = prefs.getString("widget_location_name", "") ?: ""
        val units = prefs.getString("widget_units", "metric") ?: "metric"
        val tempUnit = if (units == "imperial") "°F" else "°C"

        val description = weatherDescription(code)
        val iconEmoji = weatherIconEmoji(code)
        val widthDp = newOptions.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 250)

        val views = pickViews(context, widthDp, locName, temp, tempUnit, description, iconEmoji, feelsLike, humidity)
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    override fun onEnabled(context: Context) {
        try {
            WeatherWidgetWorker.enqueuePeriodic(context)
        } catch (_: Exception) {
            // ignore
        }
    }

    override fun onDisabled(context: Context) {
        try {
            WorkManager.getInstance(context).cancelAllWorkByTag("sws_widget_refresh")
            WorkManager.getInstance(context).cancelAllWorkByTag("sws_widget_refresh_once")
        } catch (_: Exception) {
            // ignore
        }
    }
}

// ---------------------------------------------------------------------------
// Shared helpers used by WeatherWidget and WeatherWidgetWorker
// ---------------------------------------------------------------------------

fun weatherDescription(code: Int): String = when {
    code == 0 -> "Clear sky"
    code <= 3 -> "Partly cloudy"
    code == 45 || code == 48 -> "Fog"
    code in 51..57 -> "Drizzle"
    code in 61..67 -> "Rain"
    code in 71..77 -> "Snow"
    code in 80..82 -> "Rain showers"
    code == 85 || code == 86 -> "Snow showers"
    code == 95 -> "Thunderstorm"
    code == 96 || code == 99 -> "Thunderstorm with hail"
    else -> "Unknown"
}

/** Matches the web app's getWeatherEmoji() in weather.ts */
fun weatherIconEmoji(code: Int): String = when {
    code == 0 -> "☀️"
    code <= 3 -> "⛅"
    code == 45 || code == 48 -> "☁️"
    code in 51..57 -> "🌦️"
    code in 61..67 -> "🌧️"
    code in 71..77 -> "❄️"
    code in 80..82 -> "🌦️"
    code == 85 || code == 86 -> "🌨️"
    code == 95 -> "⛈️"
    code == 96 || code == 99 -> "⛈️"
    else -> "🌡️"
}

private fun makePendingIntent(context: Context): PendingIntent {
    val launchIntent = Intent(context, MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    return PendingIntent.getActivity(
        context, 0, launchIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
}

private fun fillSharedViews(
    views: RemoteViews,
    locationName: String,
    temp: Int,
    tempUnit: String,
    description: String,
    iconEmoji: String,
    feelsLike: Int,
    humidity: Int,
) {
    views.setTextViewText(R.id.widget_location, locationName)
    views.setTextViewText(R.id.widget_temp, "$temp$tempUnit")
    views.setTextViewText(R.id.widget_description, description)
    views.setTextViewText(R.id.widget_icon, iconEmoji)
    views.setTextViewText(R.id.widget_feels_like, "Feels $feelsLike$tempUnit")
    views.setTextViewText(R.id.widget_humidity, "Humidity $humidity%")
}

private fun applyCustomBackground(views: RemoteViews, context: Context) {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val hex = prefs.getString("widget_bg_color", null) ?: return
    val alphaPct = prefs.getInt("widget_bg_alpha", 100)
    val alpha = (alphaPct * 255 / 100).coerceIn(0, 255)
    val rgb = Color.parseColor(hex) and 0x00FFFFFF
    val argb = (alpha shl 24) or rgb
    views.setInt(R.id.widget_root, "setBackgroundColor", argb)
}

fun buildRemoteViews(
    context: Context,
    locationName: String,
    temp: Int,
    tempUnit: String,
    description: String,
    iconEmoji: String,
    feelsLike: Int,
    humidity: Int,
): RemoteViews {
    val views = RemoteViews(context.packageName, R.layout.widget_weather)
    fillSharedViews(views, locationName, temp, tempUnit, description, iconEmoji, feelsLike, humidity)
    applyCustomBackground(views, context)
    views.setOnClickPendingIntent(R.id.widget_root, makePendingIntent(context))
    return views
}

fun buildRemoteViewsMedium(
    context: Context,
    locationName: String,
    temp: Int,
    tempUnit: String,
    description: String,
    iconEmoji: String,
    feelsLike: Int,
    humidity: Int,
): RemoteViews {
    val views = RemoteViews(context.packageName, R.layout.widget_weather_medium)
    fillSharedViews(views, locationName, temp, tempUnit, description, iconEmoji, feelsLike, humidity)
    applyCustomBackground(views, context)
    views.setOnClickPendingIntent(R.id.widget_root, makePendingIntent(context))
    return views
}

fun buildRemoteViewsSmall(
    context: Context,
    temp: Int,
    tempUnit: String,
    iconEmoji: String,
): RemoteViews {
    val views = RemoteViews(context.packageName, R.layout.widget_weather_small)
    views.setTextViewText(R.id.widget_temp_small, "$temp$tempUnit")
    views.setTextViewText(R.id.widget_icon_small, iconEmoji)
    applyCustomBackground(views, context)
    views.setOnClickPendingIntent(R.id.widget_root, makePendingIntent(context))
    return views
}

fun pickViews(
    context: Context,
    widthDp: Int,
    locationName: String,
    temp: Int,
    tempUnit: String,
    description: String,
    iconEmoji: String,
    feelsLike: Int,
    humidity: Int,
): RemoteViews = when {
    widthDp < 100 -> buildRemoteViewsSmall(context, temp, tempUnit, iconEmoji)
    widthDp < 200 -> buildRemoteViewsMedium(context, locationName, temp, tempUnit, description, iconEmoji, feelsLike, humidity)
    else -> buildRemoteViews(context, locationName, temp, tempUnit, description, iconEmoji, feelsLike, humidity)
}

fun updateAllWidgets(
    context: Context,
    locationName: String,
    temp: Int,
    tempUnit: String,
    description: String,
    iconEmoji: String,
    feelsLike: Int,
    humidity: Int,
) {
    val manager = AppWidgetManager.getInstance(context)
    val ids = manager.getAppWidgetIds(ComponentName(context, WeatherWidget::class.java))

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val responsive = RemoteViews(
            mapOf(
                SizeF(56f, 56f) to buildRemoteViewsSmall(context, temp, tempUnit, iconEmoji),
                SizeF(110f, 110f) to buildRemoteViewsMedium(context, locationName, temp, tempUnit, description, iconEmoji, feelsLike, humidity),
                SizeF(250f, 110f) to buildRemoteViews(context, locationName, temp, tempUnit, description, iconEmoji, feelsLike, humidity),
            )
        )
        for (id in ids) {
            manager.updateAppWidget(id, responsive)
        }
    } else {
        for (id in ids) {
            val widthDp = manager.getAppWidgetOptions(id)
                .getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 250)
            manager.updateAppWidget(id, pickViews(context, widthDp, locationName, temp, tempUnit, description, iconEmoji, feelsLike, humidity))
        }
    }
}
