import urllib.request
import json

url = "http://127.0.0.1:8000/api/bi/summary?days=30"
data = json.loads(urllib.request.urlopen(url).read())

w = data["weekly"]
s = data["summary"]

print("=== WEEKLY ===")
print(f"  this_week  : {w['this_week']}")
print(f"  last_week  : {w['last_week']}")
print(f"  growth_pct : {w['growth_pct']}")

print()
print("=== SUMMARY ===")
print(f"  total_generations : {s['total_generations']}")
print(f"  total_success     : {s['total_success']}")
print(f"  total_failed      : {s['total_failed']}")
print(f"  total_users       : {s['total_users']}")
print(f"  registered_users  : {s['registered_users']}")
print(f"  guest_users       : {s['guest_users']}")
print(f"  period_days       : {s['period_days']}")

print()
print("=== DAILY TREND (last 14 days) ===")
for day in data["daily_trend"][-14:]:
    print(f"  {day['date']} | total={day['total']} success={day['success']} failed={day['failed']}")
