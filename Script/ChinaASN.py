import requests
from lxml import etree
import time

def initFile():
    with open("Provider/Ruleset/ChinaASN.list", "w") as asnFile:
        asnFile.write("// ASN Information in China \n")

def initClashFile():
    with open("Provider/Ruleset/ChinaASN.yaml", "w") as clashFile:
        clashFile.write("# Clash Ruleset for China ASNs\n")
        clashFile.write("payload:\n")

def saveLatestASN():
    url = "https://bgp.he.net/country/CN"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36"
    }
    r = requests.get(url=url, headers=headers).text
    tree = etree.HTML(r)
    asns = tree.xpath('//*[@id="asns"]/tbody/tr')
    
    initFile()
    initClashFile()
    
    for asn in asns:
        asnNumber = asn.xpath('td[1]/a')[0].text.replace('AS', '')
        asnName = asn.xpath('td[2]')[0].text
        if asnName is not None:
            # Write to original ChinaASN.list
            asnInfo = "IP-ASN,{} // {}".format(asnNumber, asnName)
            with open("Provider/Ruleset/ChinaASN.list", "a") as asnFile:
                asnFile.write(asnInfo + "\n")
            
            # Write to Clash format file
            clashRule = "  - IP-ASN,{}".format(asnNumber)
            with open("Provider/Ruleset/ChinaASN.yaml", "a") as clashFile:
                clashFile.write(clashRule + "\n")

saveLatestASN()
