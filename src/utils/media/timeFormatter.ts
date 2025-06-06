export function formatTime(seconds: number = 0) {
  if (isNaN(seconds) || seconds < 0) seconds = 0

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.round(seconds % 60)

  const formattedHours = hours > 0 ? `${hours}:` : ""
  const formattedMinutes = `${hours > 0 ? String(minutes).padStart(2, "0") : minutes}:`
  const formattedSeconds = String(secs).padStart(2, "0")

  return `${formattedHours}${formattedMinutes}${formattedSeconds}`
}
