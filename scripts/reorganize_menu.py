import json
import os

MOVES = {
    "rice": {
        "main": ["싸먹는오리슬라이스", "떠먹는 유부초밥"]
    },
    "soup": {
        "dessert": ["솜사탕"]
    },
    "main": {
        "side": [
            "곱창김구이", "구이김", "김구이", "돌김구이", "들기름김구이", "불닭김",
            "불닭맛김", "생김구이", "양념김", "유기농김구이", "재래김구이",
            "조미김구이", "함초김구이",
            "드레싱 오리엔탈", "사우전", "사우전아일랜드", "양상추샐러드 오리엔탈",
            "양상추오리엔탈샐러드", "오리엔탈", "오리엔탈샐러드"
        ],
        "rice": ["밥버거", "스팸밥버거", "참치마요밥버거", "참치밥버거"]
    },
    "side": {
        "rice": ["가츠동", "규동", "나시고랭", "부타동", "텐동"],
        "main": [
            "돈고츠라멘", "돈코츠라멘", "돈코츠라면", "마라탕면", "밀면", "비빔면",
            "비빔밀면", "비빔쫄면", "사천짜장면", "삼선짜장면", "설렁탕 소면",
            "쌀짜장면", "쌀쫄면", "야채쫄면", "우동면", "우육탕면", "유니자장",
            "유니짜장", "유니짜장면", "잔치국수", "짜장", "짜장면", "짬뽕면", "쫄면",
            "탄탄멘", "탄탄면", "팟타이", "해물짜장면"
        ],
        "dessert": [
            "감귤", "거봉", "골드참다래", "곶감", "단감", "딸기", "라임", "레드글로브",
            "레드향", "리치", "망고", "머스캣", "메론", "무화과", "바나나", "반건시",
            "배", "복숭아", "사과", "산딸기", "살구", "샤인애플", "수박", "신고배",
            "연시", "오렌지", "자두", "참다래", "참외", "천도복숭아", "천혜향", "청견",
            "체리", "키위", "토마토", "파인애플", "포도", "한라봉", "황금향", "황도",
            "과수원", "나랑드사이다", "농후발효유", "리이브", "마시는...",
            "모구모구", "베스킨라빈스", "비요뜨", "비타...", "빅썬", "빠삐코", "설레임",
            "썬업", "아망추", "얼라이브", "엔요", "요구르트", "요플레", "제리뽀", "쥬시쿨",
            "초록매실", "카프리썬", "코코팜", "콜라", "쿨피스", "피크닉", "후레쉬업"
        ]
    },
    "kimchi": {
        "side": [
            "김치만두", "김치찐만두", "왕교자군만두",
            "김치부침개", "김치전"
        ],
        "main": ["김치치즈도리아", "김치카츠", "김치퀘사디아"],
        "rice": ["참치김치밥버거"]
    },
    "dessert": {
        "side": [
            "가래떡", "고추장떡", "부추장떡", "장떡", "김떡만", "녹두빈대떡",
            "어떡햄", "어떡햄어떡햄"
        ],
        "main": ["짜파게티", "차슈", "차슈돈코츠라멘", "차슈라멘"]
    }
}

FILE_PATH = os.path.join(os.path.dirname(__file__), '../data/menu_db.json')


def load_data():
    with open(FILE_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_data(data):
    with open(FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def reorganize():
    data = load_data()
    changes_count = 0

    for source_cat, destinations in MOVES.items():
        if source_cat not in data:
            print(f"Warning: Source category '{source_cat}' not found in data.")
            continue

        source_list = data[source_cat]

        for dest_cat, items in destinations.items():
            if dest_cat not in data:
                print(f"Warning: Destination category '{dest_cat}' not found. Creating it.")
                data[dest_cat] = []

            dest_list = data[dest_cat]

            for item in items:
                if item in source_list:
                    source_list.remove(item)
                    if item not in dest_list:
                        dest_list.append(item)
                        dest_list.sort()
                        print(f"Moved '{item}' from {source_cat} to {dest_cat}")
                        changes_count += 1
                    else:
                        print(f"'{item}' already in {dest_cat}, removed from {source_cat}")
                        changes_count += 1

    if changes_count > 0:
        save_data(data)
        print(f"\nSuccessfully moved {changes_count} items.")
    else:
        print("\nNo changes made. Items might have been already moved or not found.")


if __name__ == "__main__":
    try:
        reorganize()
    except Exception as e:
        print(f"An error occurred: {e}")
