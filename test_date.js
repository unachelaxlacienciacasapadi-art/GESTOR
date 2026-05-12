const today = new Date();
const threeMonthsLater = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
let currentDate = new Date(today);
const availableDates = [];
while (currentDate <= threeMonthsLater) {
  const mxDateString = currentDate.toLocaleString('en-US', { timeZone: 'America/Mexico_City' });
  const mxDateObj = new Date(mxDateString);
  const dayOfWeekMX = mxDateObj.getDay();
  if (dayOfWeekMX === 3) {
    const yyyy = mxDateObj.getFullYear();
    const mm = String(mxDateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(mxDateObj.getDate()).padStart(2, '0');
    const dateStr = yyyy + '-' + mm + '-' + dd;
    const dateWithTime = dateStr + 'T19:00:00';
    // When parsing dateWithTime in Intl.DateTimeFormat without Z or offset, JS interprets it as Local time of the node server.
    // If we want it to be explicitly 19:00 in Mexico City, we should construct a Date object that is equivalent to 19:00 in Mexico time.
    // Easiest is to format string directly. But Intl.DateTimeFormat takes a Date object.
    // To ensure Intl.DateTimeFormat treats it correctly when formatted in Mexico City time,
    // we must supply a Date object that corresponds to 19:00 in Mexico City.
    // Instead of doing new Date(dateWithTime), we can just build the final string ourselves!
    // Since we know it's 19:00, we just need the localized date part.
    
    // OR we can just append the offset for Mexico City, but offset changes with daylight saving (though Mexico abolished it mostly, some border cities still observe it).
    // Let's use standard Intl.DateTimeFormat:
    // If we do new Date(dateWithTime), it parses as LOCAL time of server.
    // If the server is in UTC, it parses as UTC. Then formatting in 'America/Mexico_City' will shift it!
    // We MUST format the date manually or construct it properly.
    
    // Actually, we can just use the mxDateObj, set its hours to 19, and format it! But wait, mxDateObj is local time.
    // If we just want the output format, we can do:
    const formatter = new Intl.DateTimeFormat('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' // We force UTC so it doesn't shift
    });
    // Create a UTC date:
    const utcDate = new Date(Date.UTC(yyyy, mxDateObj.getMonth(), mxDateObj.getDate(), 19, 0, 0));
    const formattedDatePart = formatter.format(utcDate);
    const formatted = formattedDatePart + ', 19:00 hrs'; // Or whatever format they asked for
    
    availableDates.push({ date: dateWithTime, formatted, dayOfWeekMX });
  }
  currentDate.setDate(currentDate.getDate() + 1);
}
console.log(availableDates.slice(0, 5));
