package com.cph5236.simpleweatherservice

import android.content.Context
import androidx.work.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.URL
import java.util.concurrent.TimeUnit

class WeatherWidgetWorker(
    private val ctx: Context,
    workerParams: WorkerParameters,
) : CoroutineWorker(ctx, workerParams) {

    companion object {
        private const val WORK_TAG_PERIODIC = "sws_widget_refresh"
        private const val WORK_TAG_IMMEDIATE = "sws_widget_refresh_once"

        fun enqueuePeriodic(context: Context) {
            val request = PeriodicWorkRequestBuilder<WeatherWidgetWorker>(30, TimeUnit.MINUTES)
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build()
                )
                .addTag(WORK_TAG_PERIODIC)
                .build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_TAG_PERIODIC,
                ExistingPeriodicWorkPolicy.KEEP,
                request,
            )
        }

        fun enqueueImmediate(context: Context) {
            val request = OneTimeWorkRequestBuilder<WeatherWidgetWorker>()
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build()
                )
                .addTag(WORK_TAG_IMMEDIATE)
                .build()
            WorkManager.getInstance(context).enqueueUniqueWork(
                WORK_TAG_IMMEDIATE,
                ExistingWorkPolicy.REPLACE,
                request,
            )
        }
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        if (!prefs.getBoolean("widget_configured", false)) return@withContext Result.success()

        val lat = prefs.getFloat("widget_location_lat", 0f)
        val lon = prefs.getFloat("widget_location_lon", 0f)
        val units = prefs.getString("widget_units", "metric") ?: "metric"
        val locName = prefs.getString("widget_location_name", "") ?: ""

        try {
            val unitParams = if (units == "imperial") "&temperature_unit=fahrenheit&wind_speed_unit=mph" else ""
            val urlStr = "https://api.open-meteo.com/v1/forecast" +
                "?latitude=$lat&longitude=$lon" +
                "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day" +
                "$unitParams&timezone=auto&forecast_days=1"

            val json = JSONObject(URL(urlStr).readText())
            val current = json.getJSONObject("current")

            val temp = Math.round(current.getDouble("temperature_2m")).toInt()
            val feelsLike = Math.round(current.getDouble("apparent_temperature")).toInt()
            val humidity = current.getInt("relative_humidity_2m")
            val weatherCode = current.getInt("weather_code")
            val tempUnit = if (units == "imperial") "°F" else "°C"

            val description = weatherDescription(weatherCode)
            val iconEmoji = weatherIconEmoji(weatherCode)

            prefs.edit()
                .putInt("widget_last_temp", temp)
                .putInt("widget_last_feels_like", feelsLike)
                .putInt("widget_last_humidity", humidity)
                .putInt("widget_last_code", weatherCode)
                .apply()

            updateAllWidgets(ctx, locName, temp, tempUnit, description, iconEmoji, feelsLike, humidity)
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
