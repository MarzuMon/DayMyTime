import axios from "axios";

export async function getTrends() {
  // You can upgrade this with Google Trends API later
  return [
    "AI productivity tools",
    "historic battles",
    "time management hacks",
    "morning routines",
    "focus techniques"
  ];
}