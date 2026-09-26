import pythainlp
from pythainlp.corpus import thai_words
from pythainlp.tag import pos_tag
import json
import random

def main():
    print("Fetching thai words...")
    words = list(thai_words())
    print(f"Total words: {len(words)}")
    nouns = []
    
    print("Tagging words...")
    # Tagging all words might take a bit. Let's do batch or just loop
    # actually, pythainlp pos_tag might be slow if we pass 60k words individually, 
    # but we can pass all words at once. Wait, passing all words at once means they are treated as one sentence.
    # We should just tag a subset or use a simpler approach. 
    # Let's shuffle first and stop when we reach 10,000 nouns.
    random.shuffle(words)
    
    for word in words:
        if len(word) < 2:
            continue
        tag = pos_tag([word], corpus='orchid')[0][1]
        if tag.startswith('N'):
            nouns.append(word)
            if len(nouns) % 1000 == 0:
                print(f"Found {len(nouns)} nouns...")
        if len(nouns) >= 10000:
            break
            
    print(f"Found {len(nouns)} nouns, saving to js/words.js")

    with open('js/words.js', 'w', encoding='utf-8') as f:
        f.write('const THAI_NOUNS = ' + json.dumps(nouns, ensure_ascii=False) + ';\n')

if __name__ == "__main__":
    main()
