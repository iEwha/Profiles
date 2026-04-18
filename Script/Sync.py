import os
import re
import requests

URLS = [
    "https://raw.githubusercontent.com/dler-io/Rules/main/Surge/Surge%203/Provider/Proxy.list",
    "https://raw.githubusercontent.com/ConnersHua/RuleGo/master/Surge/Ruleset/Proxy.list"
]

SURGE_OUTPUT = "Provider/Ruleset/Proxy.list"
CLASH_OUTPUT = "Provider/Ruleset/Proxy.yaml"

def fetch_rules(url):
    """下载并清洗规则"""
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()

    rules = []

    for line in resp.text.splitlines():
        line = line.strip()

        # 跳过空行
        if not line:
            continue

        # 跳过整行注释
        if line.startswith("#") or line.startswith("//"):
            continue

        # 删除尾部注释
        line = re.split(r"\s+#|\s+//", line)[0].strip()

        if not line:
            continue

        rules.append(line)

    return rules

def save_surge(rules):
    """输出 Surge list"""
    os.makedirs(os.path.dirname(SURGE_OUTPUT), exist_ok=True)

    with open(SURGE_OUTPUT, "w", encoding="utf-8") as f:
        f.write("\n".join(rules) + "\n")

def save_clash(rules):
    """输出 Clash YAML"""
    os.makedirs(os.path.dirname(CLASH_OUTPUT), exist_ok=True)

    with open(CLASH_OUTPUT, "w", encoding="utf-8") as f:
        f.write("payload:\n")
        for rule in rules:
            f.write(f"  - {rule}\n")

def merge_rules():
    all_rules = set()

    for url in URLS:
        try:
            rules = fetch_rules(url)
            all_rules.update(rules)
            print(f"已加载 {len(rules)} 条规则: {url}")
        except Exception as e:
            print(f"获取失败 {url}: {e}")

    # 排序
    sorted_rules = sorted(all_rules)

    # 输出两个格式
    save_surge(sorted_rules)
    save_clash(sorted_rules)

    print(f"合并完成，共 {len(sorted_rules)} 条规则")
    print(f"Surge 输出: {SURGE_OUTPUT}")
    print(f"Clash 输出: {CLASH_OUTPUT}")

if __name__ == "__main__":
    merge_rules()