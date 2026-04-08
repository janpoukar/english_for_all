import urllib.request
import json
import time

api_token = 'rnd_U1BnE75iaO3nIhPhjTJI5SZIoKRi'
service_id = 'srv-d7b9hnqdbo4c73ctj0rg'

print('Monitoruji deploy...\n')

for i in range(120):
    try:
        req = urllib.request.Request(
            f'https://api.render.com/v1/services/{service_id}/deploys?limit=1',
            headers={'authorization': f'Bearer {api_token}'}
        )
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            deploy = data[0]['deploy']
            status = deploy.get('status', 'unknown')
            
            print(f'[{time.strftime("%H:%M:%S")}] Status: {status}')
            
            if status == 'live':
                print('\n✓ DEPLOY HOTOV! Vlající vlajka je live!')
                break
            elif status in ['build_failed', 'deploy_failed']:
                print(f'\n✗ DEPLOY SELHALO: {status}')
                break
            else:
                time.sleep(3)
    except Exception as e:
        print(f'Error: {e}')
        break
