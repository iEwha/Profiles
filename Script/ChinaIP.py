import requests
url = "https://raw.githubusercontent.com/cbuijs/ipasn/master/country-asia-china4.list"
resp = requests.get(url)
resp.raise_for_status()          
with open("Provider/ChinaIP.list", "wb") as f:
    f.write(resp.content)
with open('Provider/Ruleset/cncidr.list', 'w') as f:
    with open('Provider/ChinaIP.list', 'r') as src:
        for line in src:
            f.write(f'IP-CIDR,{line}')
with open('Provider/Ruleset/cncidr.yaml', 'w') as f:
    f.write("payload:\n")
    with open('Provider/ChinaIP.list', 'r') as src:
        for line in src:
            f.write(f'  - IP-CIDR,{line}')
 





 


    
