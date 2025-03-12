'''
Author: Vincent Young
Copyright © 2022 by Vincent, All Rights Reserved. 
'''
import requests
from lxml import etree
import time

def initFile():
    with open("Provider/Ruleset/ASN.China.list", "w") as asnFile:
        asnFile.write("// ASN Information in China \n")


def saveLatestASN():
    url = "https://bgp.he.net/country/CN"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36"
    }
    r = requests.get(url = url, headers = headers).text
    tree = etree.HTML(r)
    asns = tree.xpath('//*[@id="asns"]/tbody/tr')
    initFile()
    for asn in asns:
        asnNumber = asn.xpath('td[1]/a')[0].text.replace('AS','')
        asnName = asn.xpath('td[2]')[0].text
        if asnName != None:
            asnInfo = "IP-ASN,{} // {}".format(asnNumber, asnName)
            with open("Provider/Ruleset/ASN.China.list", "a") as asnFile:
                asnFile.write(asnInfo)
                asnFile.write("\n")

saveLatestASN()
