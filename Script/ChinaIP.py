import requests

url = "https://raw.githubusercontent.com/cbuijs/ipasn/master/country-asia-china4.list"

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


 





 


    
