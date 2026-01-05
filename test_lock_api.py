import requests
import json

BASE_URL = "http://localhost:31161"

def test_lock():
    # 1. Get logs to find an ID
    res = requests.get(f"{BASE_URL}/api/logs")
    if res.status_code != 200:
        print("Failed to get logs:", res.text)
        return

    data = res.json()
    logs = data.get("data", [])
    if not logs:
        print("No logs found to test")
        return

    log_id = logs[0]["id"]
    current_locked = logs[0].get("locked", False)
    print(f"Testing Log ID: {log_id}, Current Locked: {current_locked}")

    # 2. Toggle Lock
    new_locked = not current_locked
    print(f"Attempting to set locked to: {new_locked}")
    
    res = requests.patch(f"{BASE_URL}/api/logs/{log_id}", json={"locked": new_locked})
    
    if res.status_code == 200:
        print("Success:", res.json())
    else:
        print(f"Failed: {res.status_code}")
        print(res.text)

if __name__ == "__main__":
    test_lock()
