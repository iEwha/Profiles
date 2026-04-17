import requests

url = "https://raw.githubusercontent.com/17mon/china_ip_list/master/china_ip_list.txt"

resp = requests.get(url)
resp.raise_for_status()   

lines = resp.text.strip().splitlines()

with open('Provider/Ruleset/cncidr.list', 'w', encoding='utf-8') as f:
    for line in lines:
        if line.strip():                     
            f.write(f'IP-CIDR,{line}\n')

with open('Provider/Ruleset/cncidr.yaml', 'w', encoding='utf-8') as f:
    f.write("payload:\n")
    for line in lines:
        if line.strip():
            f.write(f'  - IP-CIDR,{line}\n')


 





 


    
