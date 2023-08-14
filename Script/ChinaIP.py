import requests

China = "https://raw.githubusercontent.com/cbuijs/ipasn/master/country-asia-china4.list"
r = requests.get(China) 
with open("Provider/ChinaIP.list", "wb") as ip:
         ip.write(r.content)

ipv4 = open('Provider/Ruleset/cncidr.list','w')  
with open('Provider/ChinaIP.list','r') as ip:
    line = ip.readlines()     
    for line_list in line:    
        line_new = 'IP-CIDR,' + line_list  
        ipv4.write(line_new)  

Clashipv4 = open('Provider/Ruleset/cncidr.yaml','w')  
with open('Provider/ChinaIP.list','r') as ip:
    Clashipv4.write("payload: \n")
    line = ip.readlines()     
    for line_list in line:    
      line_new = '  - IP-CIDR,' + line_list 
      Clashipv4.write(line_new)  

 





 


    
