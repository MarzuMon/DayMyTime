setInterval(async()=>{

const { data } = await supabase
.from("schedules")
.select("*")

const now = new Date()

data.forEach(item=>{

const meetingTime = new Date(item.scheduled_time)

if(Math.abs(meetingTime-now)<60000){

new Notification(
item.title,
{
body:"Meeting starting now"
}
)

}

})

},60000)
