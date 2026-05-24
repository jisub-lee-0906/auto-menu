import json
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "menu_db.json"

CHECKS = {
    "main_candidates_for_side": {
        "source": "main",
        "tokens": [
            "샐러드",
            "무침",
            "생채",
            "나물",
            "장아찌",
            "피클",
            "전",
            "부침",
            "말이",
            "범벅",
        ],
    },
    "side_candidates_for_main": {
        "source": "side",
        "tokens": [
            "갈비",
            "불고기",
            "스테이크",
            "탕수",
            "돈까스",
            "돈가스",
            "카츠",
            "치킨",
            "찜닭",
            "닭갈비",
            "피자",
            "버거",
            "샌드",
            "라멘",
            "라면",
            "우동",
            "국수",
            "짜장",
            "짬뽕",
            "파스타",
            "스파게티",
        ],
    },
    "dessert_candidates_for_side": {
        "source": "dessert",
        "tokens": [
            "샐러드",
            "토스트",
            "고로케",
            "크로켓",
            "타르타르",
            "무침",
            "장아찌",
            "피클",
            "감바스",
            "떡",
        ],
    },
    "dessert_candidates_for_main": {
        "source": "dessert",
        "tokens": [
            "피자",
            "버거",
            "샌드",
            "라멘",
            "라면",
            "우동",
            "국수",
            "짜장",
            "짬뽕",
            "파스타",
            "스파게티",
        ],
    },
    "side_candidates_for_dessert": {
        "source": "side",
        "tokens": [
            "주스",
            "우유",
            "요거트",
            "요구르트",
            "푸딩",
            "젤리",
            "아이스크림",
            "케이크",
            "쿠키",
            "빵",
            "과일",
        ],
    },
}


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))

    for name, config in CHECKS.items():
        items = data[config["source"]]
        matches = [item for item in items if any(token in item for token in config["tokens"])]
        print(f"## {name} ({len(matches)})")
        for item in matches[:200]:
            print(item)
        print()


if __name__ == "__main__":
    main()
