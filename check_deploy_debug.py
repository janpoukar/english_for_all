import urllib.request
import json

api_token = 'rnd_U1BnE75iaO3nIhPhjTJI5SZIoKRi'
service_id = 'srv-d7b9hnqdbo4c73ctj0rg'

print('Čtu API response...\n')

try:
    req = urllib.request.Request(
        f'https://api.render.com/v1/services/{service_id}/deploys?limit=1',
        headers={'authorization': f'Bearer {api_token}'}
    )
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print("Full JSON response:")
        print(json.dumps(data, indent=2)[:2000])
        
        if isinstance(data, list) and len(data) > 0:
            deploy = data[0]
            print("\nFirst deploy object keys:")
            for key in deploy.keys():
                print(f"  - {key}: {str(deploy[key])[:100]}")
except Exception as e:
    print(f'ERROR: {e}')
