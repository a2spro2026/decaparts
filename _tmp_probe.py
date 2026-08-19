import os, paramiko
PW = os.environ.get('VPS_SSH_PASSWORD', 'A2sprVps2026!Secure')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('51.255.162.99', username='ubuntu', password=PW, timeout=30, allow_agent=False, look_for_keys=False)
cmds = [
    "curl -s -o /dev/null -w '%{http_code}' https://decaparts.a2spr.com/app/login",
    "curl -s -o /dev/null -w '%{http_code}' https://decaparts.a2spr.com/app",
    'ls -la /var/www/decaparts.a2spr.com/',
]
for cmd in cmds:
    _i,o,e = c.exec_command(cmd)
    print(cmd, '->', o.read().decode().strip())
c.close()
