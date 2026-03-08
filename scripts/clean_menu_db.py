import json
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "menu_db.json"

NORMALIZE_RENAMES = {
    "kimchi": {
        "알타리": "알타리김치",
    },
    "soup": {
        "짬봉국": "짬뽕국",
    },
    "side": {
        "비요트": "비요뜨",
        "브로컬리": "브로콜리",
    },
    "main": {
        "닭계장": "닭개장",
    },
    "dessert": {
        "섞박지": "석박지",
    },
}

RESTORE_ITEMS = {
    "soup": [
        "감자수제비국",
        "고추장수제비국",
        "김치수제비국",
        "낙지수제비국",
        "다슬기수제비국",
        "도토리수제비국",
        "들깨수제비국",
        "수제비국",
        "수제비만두국",
        "수제비미역국",
        "손수제비국",
        "얼큰수제비국",
        "짬뽕수제비국",
        "참깨수제비국",
        "해물수제비국",
        "호박수제비국",
    ],
}

REMOVE_ITEMS = {
    "side": [
        "감자비",
        "깻잎찬",
        "달콤한",
        "너츠",
        "브라운",
        "사리",
        "사리면",
        "선식",
        "탄산수",
        "원예",
        "채틱",
        "코코",
        "케마",
        "케요",
        "타르",
        "짬뽕비",
        "삼색비",
        "바지락비",
    ],
    "dessert": [
        "견과",
        "견과류",
        "과일",
        "과일음료",
        "꽃빵",
        "딸기맛",
        "딸기잼",
        "딸기쨈",
        "라떼",
        "메밀차",
        "사과맛",
        "슈퍼",
        "씨리얼",
        "아망추",
        "암기빵",
        "요아정",
        "음료수",
        "제티",
        "현미",
    ],
    "main": [
        "갑오징어",
        "강정",
        "낙지비",
        "닭고기",
        "닭날개",
        "닭다리",
        "닭봉",
        "닭살",
        "닭윙",
        "닭장각",
        "돼지고기",
        "소시지",
        "쇠고기",
        "오징어",
        "우동면",
    ],
    "kimchi": [
        "김치류",
        "김치비",
    ],
}

EXACT_MOVES = {
    "dessert": {
        "main": [
            "감바스",
        ],
        "kimchi": [
            "석박지",
        ],
        "side": [
            "감귤샐러드",
            "감귤타르타르",
            "감말랭이무침",
            "감말랭이장아찌",
            "감자사과샐러드",
            "게살크림고로케",
            "고추장떡",
            "구슬치즈토마토샐러드",
            "계란토스트",
            "마늘토스트",
            "모닝토스트",
            "아침토스트세트",
            "이삭토스트",
            "연근칩",
            "장떡",
            "지파이",
            "토스트",
            "훈제란",
            "햄치즈샌드위치",
            "김떡만",
            "떡꼬치",
            "떡쌈",
            "어떡햄",
            "녹차맛김",
            "녹차무쌈",
            "무배생채",
            "부추장떡",
            "알배기쌈",
            "꽃빵",
            "녹두빈대떡",
            "떡말이어묵",
            "떡새우완자",
            "배오이무침",
            "사과무생채",
            "토스트바",
            "핫도그샐러드빵",
        ],
    },
    "kimchi": {
        "side": [
            "검은깨두부김치",
            "김치도토리묵무침",
            "도토리묵김치무침",
            "두부김치",
            "메밀묵김치무침",
        ],
    },
    "side": {
        "dessert": [
            "비요뜨",
            "과즙워터",
            "꽃카롱",
            "냉매실차",
            "녹차보리차",
            "단백질바",
            "대추차",
            "매실차",
            "모둠견과",
            "모듬견과",
            "비스켓",
            "땡모반",
            "불가리스",
            "비타자몽",
            "뽀로로",
            "붓세",
            "누네띠네",
            "과일샐러드",
            "과일야채샐러드",
            "과일양상추샐러드",
            "꽃맛살과일샐러드",
            "모듬과일샐러드",
            "생과일샐러드",
            "생크림과일샐러드",
            "시리얼과일샐러드",
            "씨리얼과일샐러드",
            "양상추과일샐러드",
            "열대과일샐러드",
            "황도과일샐러드",
        ],
        "rice": [
            "건강현미찹쌀",
        ],
        "main": [
            "광어까스",
            "깐풍육",
            "난자완스",
            "냉채족발",
            "대구까스",
            "대파족발",
            "돈마호크",
            "돈육바베큐",
            "돈육편육",
            "돈육폭찹",
            "돈육훈제",
            "동파육",
            "돼지불백",
            "돼지족발",
            "돼지편육",
            "돼지훈제",
            "두부까스",
            "두부카츠",
            "두부탕수",
            "두부텐더",
            "마늘족발",
            "마왕족발",
            "멘츠카츠",
            "반반족발",
            "버팔로윙",
            "별카츠",
            "볼카츠",
            "사태족발",
            "새우까스",
            "생선까스",
            "세서미두부카츠",
            "스틱카츠",
            "연돈볼카츠",
            "유린기",
            "족발",
            "지삼선",
            "치즈카츠",
            "치즈롤카츠",
            "치즈폭포돈가스",
            "통모짜치즈카츠",
            "하트꼬마돈가스",
            "황금별카츠",
            "황금알카츠",
            "꼬불짜장면",
            "비빔라면",
            "쫄짜장",
            "채식짜장면",
            "홍루이젠샌드위치",
        ],
        "soup": [
            "가쓰오우동국물",
            "게국지",
            "맑은우동국물",
            "유부우동국물",
            "우동국물",
            "짬뽕국물",
        ],
    },
    "main": {
        "dessert": [
            "동전빵",
        ],
        "side": [
            "강낭콩조림",
            "가지구이무침",
            "가지볶음",
            "가지전",
            "감자전",
            "감자조림",
            "감자채볶음",
            "감자튀김",
            "감자햄볶음",
            "감자햄조림",
            "건새우볶음",
            "건파래구이",
            "건파래볶음",
            "검은콩조림",
            "검정콩조림",
            "견과류조림",
            "계란구이",
            "계란볶음",
            "계란야채찜",
            "계란장조림",
            "계란팬구이",
            "갑오징어무침",
            "갑오징어초무침",
            "냉파스타샐러드",
            "닭가슴살샐러드",
            "고구마조림",
            "고구마튀김",
            "고사리볶음",
            "고추장볶음",
            "곤약콩조림",
            "공심채볶음",
            "돈가스샐러드",
            "도라지볶음",
            "떡갈비샐러드",
            "궁채볶음",
            "김가루볶음",
            "김자반볶음",
            "김치볶음",
            "깻잎멸치찜",
            "깻잎순볶음",
            "깻잎순조림",
            "깻잎양념찜",
            "꽈리고추찜",
            "목살스테이크샐러드",
            "무말랭이오징어무침",
            "보쌈무생채",
            "불고기샐러드",
            "브로콜리오징어초무침",
            "새우버거",
            "새우튀김샐러드",
            "샐러드파스타",
            "오리엔탈양상추샐러드",
            "오리훈제샐러드",
            "오징어무침",
            "오징어배초무침",
            "치킨무",
            "피자빵",
            "핫도그",
        ],
        "soup": [
            "닭개장",
        ],
    },
}

OVERLAP_PREFERENCES = {
    ("main", "side"): {
        "가자미구이": "main",
        "고등어구이": "main",
    },
}


def load_data():
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


def save_data(data):
    DATA_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def move_exact_items(data):
    changes = []

    for source, destinations in EXACT_MOVES.items():
        for destination, items in destinations.items():
            for item in items:
                if item not in data[source]:
                    continue

                data[source].remove(item)
                if item not in data[destination]:
                    data[destination].append(item)
                changes.append((item, source, destination))

    return changes


def restore_items(data):
    changes = []

    for category, items_to_add in RESTORE_ITEMS.items():
        for item in items_to_add:
            if item not in data[category]:
                data[category].append(item)
                changes.append((category, item))

    return changes


def normalize_names(data):
    changes = []

    for category, replacements in NORMALIZE_RENAMES.items():
        for old_name, new_name in replacements.items():
            if old_name not in data[category]:
                continue

            data[category].remove(old_name)
            if new_name not in data[category]:
                data[category].append(new_name)
            changes.append((category, old_name, new_name))

    return changes


def remove_unusable_items(data):
    changes = []

    for category, items_to_remove in REMOVE_ITEMS.items():
        for item in items_to_remove:
            if item in data[category]:
                data[category].remove(item)
                changes.append((category, item))

    return changes


def remove_intra_category_duplicates(data):
    changes = []

    for category, items in data.items():
        deduped = list(dict.fromkeys(items))
        removed = len(items) - len(deduped)
        if removed:
            data[category] = deduped
            changes.append((category, removed))

    return changes


def resolve_cross_category_overlaps(data):
    changes = []

    for (left, right), item_preferences in OVERLAP_PREFERENCES.items():
        for item, keep in item_preferences.items():
            if item not in data[left] or item not in data[right]:
                continue

            drop_from = right if keep == left else left
            data[drop_from].remove(item)
            changes.append((item, keep, drop_from))

    return changes


def sort_categories(data):
    for category in data:
        data[category] = sorted(data[category])


def main():
    data = load_data()

    normalized = normalize_names(data)
    restored = restore_items(data)
    moved = move_exact_items(data)
    removed_items = remove_unusable_items(data)
    removed_duplicates = remove_intra_category_duplicates(data)
    resolved_overlaps = resolve_cross_category_overlaps(data)
    sort_categories(data)
    save_data(data)

    print(f"Normalized names: {len(normalized)}")
    for category, old_name, new_name in normalized:
        print(f"- {category}: {old_name} -> {new_name}")

    print(f"Restored items: {len(restored)}")
    for category, item in restored:
        print(f"- {category}: {item}")

    print(f"Moved items: {len(moved)}")
    for item, source, destination in moved:
        print(f"- {item}: {source} -> {destination}")

    print(f"Removed unusable items: {len(removed_items)}")
    for category, item in removed_items:
        print(f"- {category}: {item}")

    print(f"Resolved overlaps: {len(resolved_overlaps)}")
    for item, kept_in, removed_from in resolved_overlaps:
        print(f"- {item}: kept in {kept_in}, removed from {removed_from}")

    print(f"Intra-category duplicates removed: {sum(count for _, count in removed_duplicates)}")


if __name__ == "__main__":
    main()
