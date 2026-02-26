import re
import emoji

from preprocessing.sinhalese_characters import get_simplified_character


def replace_url(text: str) -> str:
    """
    replace URL of a text
    :param text: text to replace urls
    :return: url removed text
    """
    return re.sub(
        r"(http://www\.|https://www\.|http://|https://)[a-z0-9]+([\-.]{1}[a-z0-9A-Z/]+)*",
        "",
        text,
    )


def remove_retweet_state(text: str) -> str:
    """
    remove retweet states in the beginning such as "RT @sam92ky: "
    :param text: text
    :return: text removed retweets state
    """
    return re.sub(r"^RT @\w*: ", "", text)


def replace_mention(text: str) -> str:
    return re.sub(r"@\w*", "PERSON", text)


# -----------------------------
# Emoji compatibility helpers
# -----------------------------
def _emoji_keys():
    """
    Returns a list-like view of emoji characters for both old and new emoji library versions.
    - emoji v2+ uses emoji.EMOJI_DATA
    - older versions used emoji.UNICODE_EMOJI (dict / set depending on version)
    """
    if hasattr(emoji, "EMOJI_DATA"):
        return emoji.EMOJI_DATA.keys()

    if hasattr(emoji, "UNICODE_EMOJI"):
        ue = emoji.UNICODE_EMOJI
        # sometimes dict: {emoji_char: name}
        if isinstance(ue, dict):
            return ue.keys()
        # sometimes set/list-like
        try:
            return ue.keys()
        except Exception:
            return ue

    return []


def split_tokens(text: str) -> list:
    """
    tokenize text
    :param text: text
    :return: token list
    """
    # text characters to split is from: https://github.com/madurangasiriwardena/corpus.sinhala.tools
    emojis = "".join(_emoji_keys())

    return [
        token
        for token in re.split(
            r"[.…,‌ ¸‚\"/|—¦”‘\'“’´!@#$%^&*+\-£?˜()\[\]{\}:;–Ê  �‪‬‏0123456789"
            + emojis
            + r"]",
            text,
        )
        if token != ""
    ]


def set_spaces_among_emojis(text: str) -> str:
    """
    make spaces among emojis to tokenize them
    :param text: text to be modified
    :return: modified text
    """
    modified_text = ""
    emoji_set = set(_emoji_keys())

    for c in text:
        modified_text += c
        if c in emoji_set:
            modified_text += " "

    return modified_text


def simplify_sinhalese_text(text: str) -> str:
    """
    simplify
    :param text:
    :return:
    """
    modified_text = ""
    for c in text:
        modified_text += get_simplified_character(c)
    return modified_text


def stem_word(word: str) -> str:
    """
    Stemming words
    :param word: word
    :return: stemmed word
    """
    if len(word) < 4:
        return word

    # remove 'ට'
    if word[-1] == "ට":
        return word[:-1]

    # remove 'ද'
    if word[-1] == "ද":
        return word[:-1]

    # remove 'ටත්'
    if word[-3:] == "ටත්":
        return word[:-3]

    # remove 'එක්' (written as 'ෙක්' after simplification sometimes)
    if word[-3:] == "ෙක්":
        return word[:-3]

    # remove 'එ'
    if word[-1:] == "ෙ":
        return word[:-1]

    # remove 'ක්'
    if word[-2:] == "ක්":
        return word[:-2]

    # remove 'ගෙ' (instead of ගේ because this step comes after simplifying text)
    if word[-2:] == "ගෙ":
        return word[:-2]

    # else
    return word


def tokenize(text: str) -> list:
    # cleaned -> simplified -> mention/url removed -> tokenized -> stemmed
    cleaned = remove_retweet_state(text.strip('"')).lower()
    simplified = simplify_sinhalese_text(cleaned)
    simplified = replace_mention(simplified)
    simplified = replace_url(simplified)

    return [stem_word(token) for token in split_tokens(simplified)]