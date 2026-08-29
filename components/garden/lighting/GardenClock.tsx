// The clock consumes the same state that positions the Sun and Moon.
import type { UkGardenTime } from "./uk-garden-time";
// The clock also presents the same live weather driving the visible atmosphere.
import type { GardenWeather } from "../weather/garden-weather";

// Describe the single value required by the clock interface.
type GardenClockProps = {
  // One shared snapshot prevents the label and sky from disagreeing.
  time: UkGardenTime;
  // Weather makes the external observation legible instead of feeling arbitrary.
  weather: GardenWeather;
};

// Render the current UK civil time as a quiet part of the garden atmosphere.
export function GardenClock({ time, weather }: GardenClockProps) {
  // A semantic time element remains useful without making every second live-announced.
  return (
    <div className="garden-time" role="timer" aria-live="off">
      {/* The ISO instant is machine-readable while the text follows UK time. */}
      <time dateTime={time.isoDateTime}>{time.timeLabel}</time>
      {/* GMT or BST makes the daylight-saving rule visible to the visitor. */}
      <span>
        {time.zoneLabel} · {time.season} {time.periodLabel}
      </span>
      {/* Label the real condition and temperature behind the current atmosphere. */}
      <span className="garden-weather">
        {weather.live ? "London" : "local fallback"} · {weather.label}
        {weather.temperatureC === null
          ? ""
          : ` · ${Math.round(weather.temperatureC)}°C`}
      </span>
      {/* The calendar date grounds the seasonal atmosphere in a real day. */}
      <small>{time.dateLabel}</small>
    </div>
  );
}
