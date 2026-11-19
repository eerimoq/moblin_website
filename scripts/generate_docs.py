import argparse
import functools
import heapq
import json
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Token:
    kind: str
    value: str


IDENT_START = re.compile(r"[A-Za-z_@#$]")
IDENT_CHAR = re.compile(r"[A-Za-z0-9_]")
PLACEHOLDER = "…"
MAX_VIEW_DEPTH = 20


def read_interpolation(source, i):
    depth = 1
    while i < len(source) and depth > 0:
        c = source[i]
        if c == '"':
            _, i = read_string(source, i)
            continue
        if c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
        i += 1
    return i


def unescape(c):
    return {"n": "\n", "t": "\t", "0": ""}.get(c, c)


def read_multiline_string(source, i):
    i += 3
    while source[i] != "\n":
        i += 1
    i += 1
    parts = []
    while not source.startswith('"""', i):
        c = source[i]
        if c == "\\":
            nxt = source[i + 1]
            if nxt == "(":
                end = read_interpolation(source, i + 2)
                parts.append(f"\x01{source[i + 2 : end - 1].strip()}\x02")
                i = end
                continue
            if nxt == "\n":
                parts.append("\x00")
                i += 2
                continue
            parts.append(unescape(nxt))
            i += 2
            continue
        parts.append(c)
        i += 1
    text = "".join(parts)
    lines = text.split("\n")
    indent = len(lines[-1]) - len(lines[-1].lstrip(" "))
    lines = [line[indent:] for line in lines[:-1]]
    text = "\n".join(lines).replace("\x00\n", "").replace("\x00", "")
    text = re.sub(r"\n *", "\n", text)
    return text, i + 3


def read_string(source, i):
    if source.startswith('"""', i):
        return read_multiline_string(source, i)
    i += 1
    parts = []
    while source[i] != '"':
        c = source[i]
        if c == "\\":
            nxt = source[i + 1]
            if nxt == "(":
                end = read_interpolation(source, i + 2)
                parts.append(f"\x01{source[i + 2 : end - 1].strip()}\x02")
                i = end
                continue
            parts.append(unescape(nxt))
            i += 2
            continue
        parts.append(c)
        i += 1
    return "".join(parts), i + 1


def tokenize(source):
    tokens: list = []
    i = 0
    n = len(source)
    while i < n:
        c = source[i]
        if c.isspace():
            i += 1
        elif source.startswith("//", i):
            while i < n and source[i] != "\n":
                i += 1
        elif source.startswith("/*", i):
            depth = 0
            while i < n:
                if source.startswith("/*", i):
                    depth += 1
                    i += 2
                elif source.startswith("*/", i):
                    depth -= 1
                    i += 2
                    if depth == 0:
                        break
                else:
                    i += 1
        elif (
            c == "/"
            and source[i + 1] not in " /*="
            and (not tokens or (tokens[-1].kind == "punct" and tokens[-1].value in "(=,[:"))
        ):
            j = i + 1
            while j < n and source[j] not in "/\n":
                j += 2 if source[j] == "\\" else 1
            if j < n and source[j] == "/":
                i = j + 1
            else:
                tokens.append(Token("punct", c))
                i += 1
        elif c == '"':
            value, i = read_string(source, i)
            tokens.append(Token("string", value))
        elif c == "#" and source.startswith('#"', i):
            end = source.index('"#', i + 2)
            tokens.append(Token("string", source[i + 2 : end]))
            i = end + 2
        elif c == "`" and "`" in source[i + 1 : i + 40]:
            end = source.index("`", i + 1)
            tokens.append(Token("ident", source[i + 1 : end]))
            i = end + 1
        elif IDENT_START.match(c):
            j = i + 1
            while j < n and IDENT_CHAR.match(source[j]):
                j += 1
            tokens.append(Token("ident", source[i:j]))
            i = j
        elif c.isdigit():
            j = i + 1
            while j < n and (source[j].isalnum() or source[j] in "._"):
                j += 1
            tokens.append(Token("number", source[i:j]))
            i = j
        else:
            tokens.append(Token("punct", c))
            i += 1
    return tokens


CONTROLS = {
    "Slider",
    "Stepper",
    "TextField",
    "SecureField",
    "Picker",
    "Toggle",
    "TextEditNavigationView",
    "MultiLineTextFieldNavigationView",
    "ColorPicker",
    "DatePicker",
    "SliderView",
}

SHEETS = {"sheet", "popover", "alert", "confirmationDialog", "fullScreenCover"}

INLINE_ONLY = {"TextEditNavigationView", "MultiLineTextFieldNavigationView", "InlinePickerView"}

OPEN = {"(": ")", "{": "}", "[": "]"}


def matching(tokens, i):
    open_char = tokens[i].value
    close_char = OPEN[open_char]
    depth = 0
    while i < len(tokens):
        token = tokens[i]
        if token.kind == "punct":
            if token.value == open_char:
                depth += 1
            elif token.value == close_char:
                depth -= 1
                if depth == 0:
                    return i
        i += 1
    return len(tokens) - 1


def is_punct(tokens, i, value):
    return i < len(tokens) and tokens[i].kind == "punct" and tokens[i].value == value


def is_ident(tokens, i, value=None):
    return i < len(tokens) and tokens[i].kind == "ident" and (value is None or tokens[i].value == value)


def split_arguments(tokens):
    arguments = []
    start = 0
    i = 0
    while i < len(tokens):
        if tokens[i].kind == "punct" and tokens[i].value in OPEN:
            i = matching(tokens, i) + 1
            continue
        if is_punct(tokens, i, ","):
            arguments.append(tokens[start:i])
            start = i + 1
        i += 1
    if start < len(tokens):
        arguments.append(tokens[start:])
    result = []
    for argument in arguments:
        if len(argument) >= 2 and argument[0].kind == "ident" and is_punct(argument, 1, ":"):
            result.append((argument[0].value, argument[2:]))
        else:
            result.append((None, argument))
    return result


def literal(tokens):
    if len(tokens) == 1 and tokens[0].kind == "string":
        return tokens[0].value
    if (
        len(tokens) >= 4
        and is_ident(tokens, 0, "String")
        and is_punct(tokens, 1, "(")
        and is_ident(tokens, 2, "localized")
        and tokens[4].kind == "string"
    ):
        return tokens[4].value
    if (
        len(tokens) == 4
        and is_ident(tokens, 0, "String")
        and is_punct(tokens, 1, "(")
        and tokens[2].kind == "string"
    ):
        return tokens[2].value
    if (
        len(tokens) >= 3
        and tokens[0].kind == "ident"
        and tokens[0].value in ("LocalizedStringKey", "Text")
        and is_punct(tokens, 1, "(")
        and tokens[2].kind == "string"
    ):
        return tokens[2].value
    return None


def strings_in(tokens):
    return [token.value for token in tokens if token.kind == "string"]


INTERPOLATION = re.compile("\x01([^\x02]*)\x02")


def clean(text):
    if text is None:
        return None
    text = INTERPOLATION.sub(lambda m: "" if m.group(1).startswith("Image(") else PLACEHOLDER, text)
    text = re.sub(r"[ \t]+", " ", text).strip()
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    if not text or text == PLACEHOLDER:
        return None
    if re.fullmatch(r"[\W\d_…]*", text):
        return None
    return text


@dataclass
class Struct:
    name: str
    tokens: list
    properties: dict
    file: int = 0


def parse_arrays(tokens, arrays):
    for i in range(len(tokens) - 4):
        if not is_ident(tokens, i, "let") or not is_ident(tokens, i + 1):
            continue
        j = i + 2
        if is_punct(tokens, j, ":"):
            while j < len(tokens) and not is_punct(tokens, j, "=") and j < i + 8:
                j += 1
        if not is_punct(tokens, j, "=") or not is_punct(tokens, j + 1, "["):
            continue
        end = matching(tokens, j + 1)
        values = literal_list(tokens[j + 2 : end])
        if values:
            arrays.setdefault(tokens[i + 1].value, values)


def literal_list(tokens):
    values = []
    for _, value in split_arguments(tokens):
        if len(value) == 1 and value[0].kind in ("number", "string"):
            values.append(value[0].value.replace("_", "") if value[0].kind == "number" else value[0].value)
        elif len(value) == 2 and is_punct(value, 0, "-") and value[1].kind == "number":
            values.append("-" + value[1].value)
        else:
            return None
    return values


def parse_declarations(tokens, file, structs, file_structs, classes, enums, inits):
    i = 0
    while i < len(tokens):
        token = tokens[i]
        if token.kind == "ident" and token.value in ("struct", "class", "enum", "extension"):
            if i + 1 >= len(tokens) or tokens[i + 1].kind != "ident":
                i += 1
                continue
            name = tokens[i + 1].value
            j = i + 2
            while j < len(tokens) and not is_punct(tokens, j, "{"):
                if is_punct(tokens, j, "}") or is_punct(tokens, j, ";"):
                    break
                j += 1
            if not is_punct(tokens, j, "{"):
                i += 1
                continue
            end = matching(tokens, j)
            body = tokens[j + 1 : end]
            header = tokens[i + 2 : j]
            if token.value == "struct":
                if any(is_ident([t], 0, "View") for t in header):
                    struct = Struct(name, body, parse_properties(body, {}), file)
                    structs.setdefault(name, struct)
                    file_structs.setdefault(file, {})[name] = struct
            elif token.value == "class":
                class_inits: dict = {}
                classes.setdefault(name, {}).update(parse_properties(body, class_inits))
                for prop, overrides in class_inits.items():
                    inits[(name, prop)] = overrides
            if token.value in ("enum", "extension"):
                enum = enums.setdefault(name, {"cases": [], "raw": {}, "strings": {}})
                parse_enum(body, enum, token.value == "enum")
            i = j + 1
            continue
        i += 1


def parse_default(value):
    result = None
    if not value:
        return None
    if value[0].kind in ("number", "string"):
        if len(value) < 2 or not is_punct(value, 1, "."):
            result = (value[0].kind, value[0].value)
    elif is_ident(value, 0, "true") or is_ident(value, 0, "false"):
        result = ("bool", value[0].value)
    elif is_punct(value, 0, "-") and len(value) > 1 and value[1].kind == "number":
        result = ("number", "-" + value[1].value)
    elif is_punct(value, 0, ".") and is_ident(value, 1) and not is_punct(value, 2, "("):
        result = ("case", value[1].value)
    else:
        k = 0
        if is_punct(value, 0, ".") and is_ident(value, 1, "init"):
            k = 2
        elif is_ident(value, 0, "String"):
            k = 1
        if k and is_punct(value, k, "(") and is_ident(value, k + 1, "localized") and len(value) > k + 3:
            if value[k + 3].kind == "string":
                result = ("string", value[k + 3].value)
    return result


def parse_init(body, j):
    if is_punct(body, j, ".") and is_ident(body, j + 1, "init"):
        j += 2
    elif is_ident(body, j) and body[j].value[:1].isupper():
        j += 1
    else:
        return None
    if not is_punct(body, j, "("):
        return None
    overrides = {}
    for name, value in split_arguments(body[j + 1 : matching(body, j)]):
        default = parse_default(value)
        if name and default:
            overrides[name] = default
    return overrides or None


def parse_properties(body, inits):
    properties = {}
    depth = 0
    i = 0
    while i < len(body):
        token = body[i]
        if token.kind == "punct" and token.value in "{([":
            depth += 1
        elif token.kind == "punct" and token.value in "})]":
            depth -= 1
        elif depth == 0 and token.kind == "ident" and token.value in ("var", "let"):
            if i + 1 < len(body) and body[i + 1].kind == "ident":
                name = body[i + 1].value
                type_name = None
                default = None
                j = i + 2
                if is_punct(body, j, ":") and j + 1 < len(body) and body[j + 1].kind == "ident":
                    type_name = body[j + 1].value
                    j += 2
                    while is_punct(body, j, ".") and is_ident(body, j + 1):
                        j += 2
                    if is_punct(body, j, "?"):
                        j += 1
                        if not is_punct(body, j, "="):
                            default = ("nil", "nil")
                if is_punct(body, j, "="):
                    default = parse_default(body[j + 1 : j + 9])
                    overrides = parse_init(body, j + 1)
                    if overrides:
                        inits[name] = overrides
                properties[name] = (type_name, default)
        i += 1
    return properties


def parse_enum(body, enum, is_enum):
    depth = 0
    i = 0
    while i < len(body):
        token = body[i]
        if token.kind == "punct" and token.value in "{([":
            depth += 1
        elif token.kind == "punct" and token.value in "})]":
            depth -= 1
        elif is_enum and depth == 0 and is_ident(body, i, "case"):
            j = i + 1
            while is_ident(body, j):
                name = body[j].value
                enum["cases"].append(name)
                j += 1
                if is_punct(body, j, "("):
                    j = matching(body, j) + 1
                if is_punct(body, j, "=") and j + 1 < len(body) and body[j + 1].kind == "string":
                    enum["raw"][name] = body[j + 1].value
                    j += 2
                if is_punct(body, j, ","):
                    j += 1
                else:
                    break
        elif (
            is_ident(body, i, "func")
            and is_ident(body, i + 1)
            and body[i + 1].value
            in (
                "toString",
                "toLocalizedString",
                "toUserString",
            )
        ):
            j = i + 2
            while j < len(body) and not is_punct(body, j, "{"):
                j += 1
            end = matching(body, j)
            parse_to_string(body[j + 1 : end], enum)
            i = end
        i += 1


def parse_to_string(body, enum):
    i = 0
    while i < len(body):
        if is_ident(body, i, "case"):
            names = []
            j = i + 1
            while is_punct(body, j, ".") and is_ident(body, j + 1):
                names.append(body[j + 1].value)
                j += 2
                if is_punct(body, j, "("):
                    j = matching(body, j) + 1
                if is_punct(body, j, ","):
                    j += 1
            if is_punct(body, j, ":"):
                k = j + 1
                while k < len(body) and not is_ident(body, k, "case") and not is_ident(body, k, "default"):
                    if body[k].kind == "string":
                        for name in names:
                            enum["strings"].setdefault(name, body[k].value)
                        break
                    k += 1
            i = j
        i += 1


class Extractor:
    def __init__(self, structs, file_structs, classes, enums, inits, arrays):
        self.structs = structs
        self.file_structs = file_structs
        self.inits = inits
        self.arrays = arrays
        self.classes = classes
        self.enums = enums
        self.pages = []
        self.page_ids = {}
        self.view_pages = {}

    def make_page(self, title, key, parent, build, extend=False):
        if key in self.view_pages:
            page = self.view_pages[key]
            if extend:
                section = new_section()
                page["sections"].append(section)
                build(page, section)
                page["sections"] = [s for s in page["sections"] if s["items"] or s["header"] or s["footer"]]
            return page
        base = slug(title)
        page_id = base
        if page_id in self.page_ids and parent:
            page_id = f"{parent['id']}-{base}"
        counter = 2
        while page_id in self.page_ids:
            page_id = f"{base}-{counter}"
            counter += 1
        page = {
            "id": page_id,
            "title": title,
            "path": (parent["path"] if parent else []) + [title],
            "parent": parent["id"] if parent else None,
            "sections": [],
        }
        self.page_ids[page_id] = page
        self.view_pages[key] = page
        self.pages.append(page)
        section = new_section()
        page["sections"].append(section)
        build(page, section)
        page["sections"] = [s for s in page["sections"] if s["items"] or s["header"] or s["footer"]]
        return page

    def struct(self, name, file):
        return self.file_structs.get(file, {}).get(name) or self.structs.get(name)

    def walk(self, view, scope, page, section, stack, strings=None, file=None, content=None, outer=None):
        struct = self.struct(view, file)
        local = {name: type_name for name, (type_name, _) in struct.properties.items() if type_name}
        local.update(scope)
        defaults = {
            name: clean(default[1])
            for name, (_, default) in struct.properties.items()
            if default and default[0] == "string" and clean(default[1])
        }
        defaults.update(strings or {})
        context = {
            "page": page,
            "stack": stack,
            "scope": local,
            "strings": defaults,
            "file": struct.file,
            "content": content,
            "outer": outer,
        }
        body_start = None
        for i in range(len(struct.tokens) - 1):
            if is_ident(struct.tokens, i, "body") and is_punct(struct.tokens, i + 1, ":"):
                body_start = i
                break
        tokens = struct.tokens
        if body_start is not None:
            k = body_start
            while k < len(tokens) and not is_punct(tokens, k, "{"):
                k += 1
            end = matching(tokens, k)
            body = tokens[k + 1 : end]
            helpers = tokens[:body_start] + tokens[end + 1 :]
        else:
            body = tokens
            helpers = []
        context["helpers"] = self.helper_functions(helpers)
        context["called"] = set()
        return self.process(body, section, context)

    def helper_functions(self, tokens):
        functions = {}
        i = 0
        while i < len(tokens):
            if (is_ident(tokens, i, "func") or is_ident(tokens, i, "var")) and is_ident(tokens, i + 1):
                name = tokens[i + 1].value
                j = i + 2
                while j < len(tokens) and not is_punct(tokens, j, "{"):
                    if is_ident(tokens, j, "func") or is_ident(tokens, j, "var"):
                        break
                    j += 1
                if is_punct(tokens, j, "{"):
                    end = matching(tokens, j)
                    functions[name] = tokens[j + 1 : end]
                    i = end
            i += 1
        return functions

    def process(self, tokens, section, context):
        i = 0
        pending = ""
        pending_end = 0
        while i < len(tokens):
            token = tokens[i]
            if token.kind != "ident":
                i += 1
                continue
            name = token.value
            if name == "if":
                j = i + 1
                while j < len(tokens) and not is_punct(tokens, j, "{"):
                    if tokens[j].kind == "punct" and tokens[j].value in "([":
                        j = matching(tokens, j)
                    j += 1
                if is_ident(tokens, j - 1, "false") and (j - 1 == i + 1 or is_punct(tokens, j - 2, ",")):
                    i = matching(tokens, j) + 1
                    continue
            if name in SHEETS and is_punct(tokens, i - 1, ".") and is_punct(tokens, i + 1, "("):
                i = matching(tokens, i + 1) + 1
                while is_punct(tokens, i, "{") or (is_ident(tokens, i) and is_punct(tokens, i + 1, ":")):
                    i = matching(tokens, i if is_punct(tokens, i, "{") else i + 2) + 1
                continue
            if name == "content" and is_punct(tokens, i + 1, "(") and is_punct(tokens, i + 2, ")"):
                if context["content"] is not None and not is_punct(tokens, i - 1, "."):
                    section = self.process(context["content"], section, context["outer"])
                    i += 3
                    continue
            if name in ("Slider", "SliderView") and is_punct(tokens, i + 1, "("):
                end = matching(tokens, i + 1)
                if pending and i - pending_end < 40:
                    self.add_slider(pending, split_arguments(tokens[i + 2 : end]), section, context)
                pending = ""
                i = end + 1
                continue
            if name == "Section":
                i, section = self.process_section(tokens, i, section, context)
                continue
            if name == "switch":
                end = self.process_switch(tokens, i, section, context)
                if end is not None:
                    i = end
                    continue
            if name == "NavigationLink":
                i = self.process_navigation_link(tokens, i, section, context)
                continue
            if name in (
                "Toggle",
                "Picker",
                "Stepper",
                "TextField",
                "SecureField",
                "ColorPicker",
                "DatePicker",
            ):
                if is_punct(tokens, i + 1, "("):
                    i = self.process_control(tokens, i, section, context)
                    continue
            if name == "navigationTitle" and is_punct(tokens, i + 1, "("):
                i = matching(tokens, i + 1) + 1
                continue
            if name in ("Text", "GrayTextView", "InfoBannerView", "BulletView") and is_punct(
                tokens, i + 1, "("
            ):
                end = matching(tokens, i + 1)
                arguments = split_arguments(tokens[i + 2 : end])
                if arguments and arguments[0][0] in (None, "text"):
                    raw = literal(arguments[0][1]) or ""
                    for key, value in context["strings"].items():
                        raw = raw.replace(f"\x01{key}\x02", value)
                    text = clean(raw)
                    if text and re.fullmatch(r"\{[^{}…]+\}", text) and name == "Text":
                        item = {"type": "variable", "label": text}
                        if "description" in context["strings"]:
                            item["description"] = context["strings"]["description"]
                        add_item(section, item)
                    elif text and (name != "Text" or len(text) >= 40):
                        add_item(section, {"type": "note", "label": text})
                    elif text and name == "Text":
                        pending = text
                        pending_end = end + 1
                i = end + 1
                continue
            if name in context["helpers"] and name not in context["called"]:
                if not is_punct(tokens, i - 1, "."):
                    context["called"].add(name)
                    section = self.process(context["helpers"][name], section, context)
            if self.struct(name, context["file"]) and not is_punct(tokens, i - 1, "."):
                if is_punct(tokens, i + 1, "("):
                    i, section = self.process_view_call(tokens, i, section, context)
                    continue
                if is_punct(tokens, i + 1, "{"):
                    end = matching(tokens, i + 1)
                    section = self.walk(
                        name,
                        {},
                        context["page"],
                        section,
                        context["stack"] + [name],
                        file=context["file"],
                        content=tokens[i + 2 : end],
                        outer=context,
                    )
                    i = end + 1
                    continue
            i += 1
        return section

    def add_slider(self, label, arguments, section, context):
        item = {"type": "setting", "label": label}
        low = high = None
        for name, value in arguments:
            text = "".join(token.value for token in value)
            if name == "in":
                match = re.fullmatch(r"(-?[\d.]*\d)\.\.\.(-?[\d.]*\d)", text)
                if match:
                    low, high = match.groups()
            elif name == "minimum" and re.fullmatch(r"-?[\d.]+", text):
                low = text
            elif name == "maximum" and re.fullmatch(r"-?[\d.]+", text):
                high = text
            elif name == "value":
                prop = self.resolve_binding(value, context["scope"])
                if prop and prop[1] and prop[1][0] == "number":
                    item["default"] = re.sub(r"\.0$", "", prop[1][1].replace("_", ""))
        if low is not None and high is not None:
            item["range"] = re.sub(r"\.0$", "", low) + " – " + re.sub(r"\.0$", "", high)
        add_item(section, item)

    def process_section(self, tokens, i, section, context):
        page = context["page"]
        new = new_section()
        j = i + 1
        if is_punct(tokens, j, "("):
            end = matching(tokens, j)
            for label, value in split_arguments(tokens[j + 1 : end]):
                if label in (None, "header"):
                    new["header"] = clean(literal(value)) or new["header"]
            j = end + 1
        if not is_punct(tokens, j, "{"):
            return i + 1, section
        end = matching(tokens, j)
        content = tokens[j + 1 : end]
        j = end + 1
        while (
            is_ident(tokens, j)
            and tokens[j].value in ("header", "footer", "content")
            and is_punct(tokens, j + 1, ":")
            and is_punct(tokens, j + 2, "{")
        ):
            closure_end = matching(tokens, j + 2)
            closure = tokens[j + 3 : closure_end]
            if tokens[j].value == "header":
                new["header"] = clean(" ".join(strings_in(closure[:8]))) or new["header"]
            elif tokens[j].value == "footer":
                new["footer"] = self.footer_text(closure)
            else:
                content = closure
            j = closure_end + 1
        page["sections"].append(new)
        self.process(content, new, context)
        if new["header"] and not any(item["type"] != "note" for item in new["items"]):
            if any(token.kind == "ident" and token.value in CONTROLS for token in content):
                new["items"].insert(0, {"type": "setting", "label": new["header"]})
        loose = new_section()
        page["sections"].append(loose)
        return j, loose

    def process_switch(self, tokens, i, section, context):
        j = i + 1
        while j < len(tokens) and not is_punct(tokens, j, "{"):
            j += 1
        enum_name = self.resolve_type(tokens[i + 1 : j], context["scope"])
        if enum_name not in self.enums or j >= len(tokens):
            return None
        end = matching(tokens, j)
        body = tokens[j + 1 : end]
        branches = []
        default: list = []
        k = 0
        while k < len(body):
            if is_ident(body, k, "case") and is_punct(body, k + 1, ".") and is_ident(body, k + 2):
                case = body[k + 2].value
                start = k + 3
                while start < len(body) and not is_punct(body, start, ":"):
                    start += 1
                stop = start + 1
                while (
                    stop < len(body)
                    and not is_ident(body, stop, "case")
                    and not is_ident(body, stop, "default")
                ):
                    if body[stop].kind == "punct" and body[stop].value in OPEN:
                        stop = matching(body, stop)
                    stop += 1
                branches.append((case, body[start + 1 : stop]))
                k = stop
                continue
            if is_ident(body, k, "default") and is_punct(body, k + 1, ":"):
                default = body[k + 2 :]
                break
            if body[k].kind == "punct" and body[k].value in OPEN:
                k = matching(body, k)
            k += 1
        views = []
        for case, branch in branches:
            if (
                branch
                and branch[0].kind == "ident"
                and self.struct(branch[0].value, context["file"])
                and is_punct(branch, 1, "(")
            ):
                views.append((case, branch))
        if len(views) < 3:
            return None
        page = context["page"]
        for case, branch in views:
            view = branch[0].value
            title = self.enum_string(enum_name, case) or humanize(view)
            call_end = matching(branch, 1)
            scope = self.argument_scope(split_arguments(branch[2:call_end]), context)

            build = functools.partial(
                self.walk, view, scope, stack=context["stack"] + [view], file=context["file"]
            )
            child = self.make_page(title, (enum_name, title), page, build, extend=True)
            add_item(section, {"type": "page", "label": title, "page": child["id"]})
        self.process(default, section, context)
        return end + 1

    def footer_text(self, tokens):
        texts = []
        i = 0
        while i < len(tokens):
            if (
                tokens[i].kind == "ident"
                and tokens[i].value in ("Text", "GrayTextView", "BulletView")
                and is_punct(tokens, i + 1, "(")
            ):
                end = matching(tokens, i + 1)
                arguments = split_arguments(tokens[i + 2 : end])
                if arguments:
                    raw = literal(arguments[0][1])
                    text = clean(raw)
                    if text:
                        texts.append(text)
                    elif raw == "":
                        texts.append("")
                i = end + 1
                continue
            i += 1
        lines = []
        for text in texts:
            if text == "" or text not in lines:
                lines.append(text)
        return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip() or None

    def navigation_title(self, tokens):
        title = None
        i = 0
        while i < len(tokens):
            if tokens[i].kind == "punct" and tokens[i].value in OPEN:
                i = matching(tokens, i) + 1
                continue
            if is_ident(tokens, i, "navigationTitle") and is_punct(tokens, i + 1, "("):
                end = matching(tokens, i + 1)
                title = clean(literal(tokens[i + 2 : end])) or title
            i += 1
        if title and PLACEHOLDER in title:
            return None
        return title

    def view_navigation_title(self, struct):
        tokens = struct.tokens
        for i in range(len(tokens) - 1):
            if is_ident(tokens, i, "body") and is_punct(tokens, i + 1, ":"):
                k = i
                while k < len(tokens) and not is_punct(tokens, k, "{"):
                    k += 1
                return self.navigation_title(tokens[k + 1 : matching(tokens, k)])
        return None

    def label_toggle(self, label, title, section, context):
        for k in range(len(label) - 1):
            if is_ident(label, k, "Toggle") and is_punct(label, k + 1, "("):
                item = {"type": "toggle", "label": title}
                for name, value in split_arguments(label[k + 2 : matching(label, k + 1)]):
                    if name == "isOn":
                        prop = self.resolve_binding(value, context["scope"])
                        if prop and prop[1] and prop[1][0] == "bool":
                            item["default"] = "On" if prop[1][1] == "true" else "Off"
                add_item(section, item)
                return

    def process_navigation_link(self, tokens, i, section, context):
        page = context["page"]
        j = i + 1
        title = None
        destination = None
        label = None
        if is_punct(tokens, j, "("):
            end = matching(tokens, j)
            for name, value in split_arguments(tokens[j + 1 : end]):
                if name is None:
                    title = clean(literal(value)) or title
                elif name == "destination":
                    destination = value
            j = end + 1
        if is_punct(tokens, j, "{"):
            end = matching(tokens, j)
            if destination is None:
                destination = tokens[j + 1 : end]
            else:
                label = tokens[j + 1 : end]
            j = end + 1
        if is_ident(tokens, j, "label") and is_punct(tokens, j + 1, ":") and is_punct(tokens, j + 2, "{"):
            end = matching(tokens, j + 2)
            label = tokens[j + 3 : end]
            j = end + 1
        if title is None and label is not None:
            title = self.label_text(label, strings=context["strings"], file=context["file"])
        if title and (PLACEHOLDER in title or title.startswith("--")):
            title = None
        destination = destination or []
        k = 0
        while is_punct(destination, k, "{") or is_ident(destination, k, "LazyView"):
            k += 1
            if is_punct(destination, k, "("):
                k += 1
        view = None
        if (
            is_ident(destination, k)
            and self.struct(destination[k].value, context["file"])
            and is_punct(destination, k + 1, "(")
        ):
            call_end = matching(destination, k + 1)
            rest = [t for t in destination[call_end + 1 :] if not (t.kind == "punct" and t.value in ")}")]
            if not rest or is_punct(rest, 0, "."):
                view = destination[k].value
        if view is None:
            if not destination:
                if title:
                    add_item(section, {"type": "setting", "label": title})
                return j
            static = title is not None
            title = title or self.navigation_title(destination)
            title = title or self.fallback_title(context["stack"][-1], page)
            key = (context["stack"][-1], context["file"], title)

            def build_inline(child, child_section):
                child_context = dict(context, page=child, called=set())
                self.process(destination, child_section, child_context)

            if label is not None and static:
                self.label_toggle(label, title, section, context)
            child = self.make_page(title, key, page, build_inline)
            add_item(section, {"type": "page", "label": title, "page": child["id"]})
            return j
        arguments = split_arguments(destination[k + 2 : call_end])
        struct = self.struct(view, context["file"])
        setting = self.title_setting(view, arguments, context)
        if setting is not None:
            setting["label"] = title or setting["label"]
            add_item(section, setting)
            return j
        if view in INLINE_ONLY or "Wizard" in view:
            return j
        static = title is not None
        title = title or self.navigation_title(destination) or self.view_navigation_title(struct)
        title = title or self.fallback_title(view, page, context["stack"][0])
        scope = self.argument_scope(arguments, context)
        file = context["file"]

        def build_view(child, child_section):
            self.walk(view, scope, child, child_section, [view], file=file)

        if label is not None and static:
            self.label_toggle(label, title, section, context)
        child = self.make_page(title, (view, struct.file, title), page, build_view)
        add_item(section, {"type": "page", "label": title, "page": child["id"]})
        return j

    def fallback_title(self, view, page, parent=None):
        title = humanize(view)
        for prefix in (page["title"].lower() + " ", humanize(parent or view).lower() + " "):
            if title.lower().startswith(prefix) and len(title) > len(prefix):
                title = title[len(prefix) :]
                return title[0].upper() + title[1:]
        return title

    def argument_scope(self, arguments, context):
        scope = {}
        for name, value in arguments:
            if name:
                resolved = self.resolve_type(value, context["scope"])
                if resolved:
                    scope[name] = resolved
                    overrides = self.resolve_overrides(value, context["scope"])
                    if overrides:
                        scope["#" + name] = overrides
        return scope

    def resolve_overrides(self, value, scope):
        if len(value) < 3:
            return scope.get("#" + value[0].value) if value else None
        owner = self.resolve_type(value[:-2], scope)
        return self.inits.get((owner, value[-1].value))

    def label_text(self, tokens, depth=0, strings=None, file=None):
        if not tokens or depth > 2:
            return None
        strings = strings or {}
        k = 0
        while k < len(tokens):
            token = tokens[k]
            if token.kind == "string":
                if not re.fullmatch(r"[a-z0-9]+(\.[a-z0-9]+)+", token.value):
                    if not (
                        k >= 2
                        and is_punct(tokens, k - 1, ":")
                        and tokens[k - 2].value in ("systemImage", "systemName", "image", "imageName", "logo")
                    ):
                        text = clean(token.value)
                        if text:
                            return text
            if is_ident(tokens, k, "Image") or is_ident(tokens, k, "icon"):
                if is_punct(tokens, k + 1, "("):
                    k = matching(tokens, k + 1) + 1
                    continue
                if is_punct(tokens, k + 1, ":") and is_punct(tokens, k + 2, "{"):
                    k = matching(tokens, k + 2) + 1
                    continue
            if (
                is_ident(tokens, k)
                and tokens[k].value in strings
                and not is_punct(tokens, k - 1, ".")
                and not is_punct(tokens, k + 1, ":")
            ):
                return strings[tokens[k].value]
            if (
                is_ident(tokens, k)
                and self.struct(tokens[k].value, file)
                and tokens[k].value not in ("GrayTextView", "Image")
                and is_punct(tokens, k + 1, "(")
                and not is_punct(tokens, k - 1, ".")
            ):
                struct = self.struct(tokens[k].value, file)
                text = self.label_text(struct.tokens, depth + 1, file=struct.file)
                if text:
                    return text
            if (
                is_ident(tokens, k)
                and tokens[k].value in ("title", "text", "name", "label")
                and is_punct(tokens, k + 1, ":")
            ):
                value = tokens[k + 2 : k + 7]
                text = literal(value) or (value[0].value if value and value[0].kind == "string" else None)
                if text:
                    return clean(text)
            k += 1
        return None

    def title_setting(self, view, arguments, context):
        names = {name for name, _ in arguments}
        if "title" not in names:
            return None
        struct = self.struct(view, context["file"])
        if any(is_ident([t], 0, "NavigationLink") or is_ident([t], 0, "Form") for t in struct.tokens):
            if view not in INLINE_ONLY:
                return None
        title = None
        description = []
        item = {"type": "setting"}
        for name, value in arguments:
            if name == "title":
                title = clean(literal(value))
            elif name in ("footers", "footer"):
                description += [clean(s) for s in strings_in(value) if clean(s)]
            elif name == "description":
                description += [clean(literal(value))] if clean(literal(value)) else []
            elif name == "value" and "sensitive" not in names:
                prop = self.resolve_property(value, context["scope"])
                if prop and prop[1] and prop[1][0] in ("number", "string") and clean(prop[1][1]):
                    item["default"] = prop[1][1].replace("_", "") if prop[1][0] == "number" else prop[1][1]
            elif name == "items" and value and value[0].kind == "ident" and value[0].value in self.enums:
                enum_name = value[0].value
                options = [self.enum_string(enum_name, case) for case in self.enums[enum_name]["cases"]]
                if options and all(options) and is_ident(value, 2, "allCases"):
                    item["type"] = "picker"
                    item["options"] = dedupe(options)
        if not title:
            return None
        item["label"] = title
        if re.fullmatch(r"\{[^{}]+\}", title):
            item["type"] = "variable"
        if description:
            item["description"] = "\n\n".join(dedupe(description))
        return {"type": item.pop("type"), "label": item.pop("label"), **item}

    def process_view_call(self, tokens, i, section, context):
        view = tokens[i].value
        end = matching(tokens, i + 1)
        arguments = split_arguments(tokens[i + 2 : end])
        j = end + 1
        if view == "SettingsSearchResultsView":
            return j, section
        setting = self.title_setting(view, arguments, context)
        if setting is not None:
            add_item(section, setting)
            return j, section
        if view in INLINE_ONLY:
            return j, section
        if view in context["stack"] or len(context["stack"]) > MAX_VIEW_DEPTH or "Wizard" in view:
            return j, section
        scope = self.argument_scope(arguments, context)
        strings = {name: clean(literal(value)) for name, value in arguments if name and clean(literal(value))}
        for name, value in arguments:
            if name and len(value) == 1 and value[0].kind == "ident" and value[0].value in context["strings"]:
                strings[name] = context["strings"][value[0].value]
        content = None
        outer = None
        if is_punct(tokens, j, "{"):
            closure_end = matching(tokens, j)
            if any(is_ident(self.struct(view, context["file"]).tokens, k, "content") for k in range(40)):
                content = tokens[j + 1 : closure_end]
                outer = context
                j = closure_end + 1
        section = self.walk(
            view,
            scope,
            context["page"],
            section,
            context["stack"] + [view],
            strings,
            file=context["file"],
            content=content,
            outer=outer,
        )
        return j, section

    def resolve_type(self, value, scope):
        if not value or value[0].kind != "ident":
            return None
        current = scope.get(value[0].value)
        if current is None and value[0].value in self.classes:
            current = value[0].value
        k = 1
        while current and is_punct(value, k, ".") and is_ident(value, k + 1):
            properties = self.classes.get(current, {})
            prop = properties.get(value[k + 1].value)
            current = prop[0] if prop else None
            k += 2
        if k != len(value):
            return None
        return current

    def resolve_binding(self, tokens, scope):
        if is_ident(tokens, 0, "Binding") and is_punct(tokens, 1, "("):
            for name, value in split_arguments(tokens[2 : matching(tokens, 1)]):
                if name == "get" and is_punct(value, 0, "{"):
                    getter = value[1 : matching(value, 0)]
                    if is_ident(getter, 0, "return"):
                        getter = getter[1:]
                    return self.resolve_property(getter, scope)
            return None
        if not tokens or tokens[0].kind != "ident" or not tokens[0].value.startswith("$"):
            return None
        return self.resolve_property(tokens, scope)

    def resolve_property(self, tokens, scope):
        if (
            is_ident(tokens, 0, "String")
            and is_punct(tokens, 1, "(")
            and matching(tokens, 1) == len(tokens) - 1
        ):
            tokens = tokens[2:-1]
        if not tokens or tokens[0].kind != "ident":
            return None
        path = [Token("ident", tokens[0].value.lstrip("$"))] + tokens[1:]
        if len(path) < 3 or not is_punct(path, -2 + len(path), ".") or not is_ident(path, len(path) - 1):
            return None
        owner = self.resolve_type(path[:-2], scope)
        if owner is None or owner not in self.classes:
            return None
        prop = self.classes[owner].get(path[-1].value)
        if prop is None:
            return None
        overrides = self.resolve_overrides(path[:-2], scope) or {}
        if path[-1].value in overrides:
            return (prop[0], overrides[path[-1].value])
        return prop

    def process_control(self, tokens, i, section, context):
        kind = tokens[i].value
        end = matching(tokens, i + 1)
        arguments = split_arguments(tokens[i + 2 : end])
        j = end + 1
        label = None
        binding = None
        for name, value in arguments:
            if name is None and label is None:
                label = clean(literal(value))
            elif name in ("selection", "isOn", "value", "text"):
                binding = value
            elif name in ("title", "label") and label is None:
                label = clean(literal(value))
        content = []
        if is_punct(tokens, j, "{"):
            closure_end = matching(tokens, j)
            content = tokens[j + 1 : closure_end]
            j = closure_end + 1
        if is_ident(tokens, j, "label") and is_punct(tokens, j + 1, ":") and is_punct(tokens, j + 2, "{"):
            closure_end = matching(tokens, j + 2)
            label = label or self.label_text(tokens[j + 3 : closure_end], file=context["file"])
            j = closure_end + 1
        if label is None and kind == "Toggle" and content:
            label = self.label_text(content, file=context["file"])
        if label is None:
            return j
        item = {
            "type": {"Toggle": "toggle", "Picker": "picker"}.get(kind, "setting"),
            "label": label,
        }
        prop = self.resolve_binding(binding, context["scope"]) if binding else None
        options = None
        values: dict = {}
        if kind == "Picker":
            options, values = self.picker_options(content)
            if options and len(options) <= 5 and len("".join(options)) <= 60:
                item["options"] = options
        if prop and prop[1]:
            if kind == "Picker":
                default = values.get(prop[1][1].replace("_", ""))
                if default is None and prop[1][0] == "case" and prop[0]:
                    default = self.enum_string(prop[0], prop[1][1])
                if default not in (options or []):
                    default = None
            else:
                default = self.format_default(prop, kind)
            if default is not None:
                item["default"] = default
        add_item(section, item)
        return j

    def enum_string(self, enum_name, case):
        enum = self.enums.get(enum_name)
        if enum is None:
            return None
        return clean(enum["strings"].get(case) or enum["raw"].get(case))

    def option_text(self, tokens, param, value):
        if len(tokens) == 1 and tokens[0].kind == "string":
            names = INTERPOLATION.findall(tokens[0].value)
            if all(name == param for name in names):
                return clean(tokens[0].value.replace(f"\x01{param}\x02", value))
            return None
        if is_ident(tokens, 0, "String") and is_punct(tokens, 1, "(") and len(tokens) == 4:
            tokens = tokens[2:3]
        if len(tokens) == 1 and is_ident(tokens, 0, param):
            return value
        return None

    def for_each_options(self, source, closure):
        param = "$0"
        if is_ident(closure, 0) and is_ident(closure, 1, "in"):
            param = closure[0].value
        text = None
        for k in range(len(closure) - 1):
            if is_ident(closure, k, "Text") and is_punct(closure, k + 1, "("):
                text = closure[k + 2 : matching(closure, k + 1)]
                break
        if text is None:
            return None
        source = split_arguments(source)[0][1]
        if source and source[0].kind == "ident" and source[0].value in self.enums:
            if len(source) != 3 or not is_ident(source, 2, "allCases"):
                return None
            if not (is_ident(text, 0, param) and is_ident(text, 2, "toString") and len(text) == 5):
                return None
            enum_name = source[0].value
            cases = self.enums[enum_name]["cases"]
            options = [(case, self.enum_string(enum_name, case)) for case in cases]
            return options if options and all(option for _, option in options) else None
        values = None
        if is_punct(source, 0, "[") and matching(source, 0) == len(source) - 1:
            values = literal_list(source[1:-1])
        elif len(source) == 1 and source[0].kind == "ident":
            values = self.arrays.get(source[0].value)
        else:
            match = re.fullmatch(r"(\d+)(\.\.\.|\.\.<)(\d+)", "".join(token.value for token in source))
            if match and int(match.group(3)) - int(match.group(1)) <= 20:
                stop = int(match.group(3)) + (1 if match.group(2) == "..." else 0)
                values = [str(number) for number in range(int(match.group(1)), stop)]
        if not values:
            return None
        options = [(value, self.option_text(text, param, value)) for value in values]
        return options if all(option for _, option in options) else None

    def picker_options(self, content):
        options = []
        values: dict = {}
        k = 0
        while k < len(content):
            if is_ident(content, k, "ForEach") and is_punct(content, k + 1, "("):
                end = matching(content, k + 1)
                if not is_punct(content, end + 1, "{"):
                    return None, {}
                closure_end = matching(content, end + 1)
                found = self.for_each_options(content[k + 2 : end], content[end + 2 : closure_end])
                if found is None:
                    return None, {}
                for value, option in found:
                    options.append(option)
                    values.setdefault(value, option)
                k = closure_end + 1
                continue
            if is_ident(content, k, "if") or is_ident(content, k, "switch"):
                return None, {}
            if is_ident(content, k, "Text") and is_punct(content, k + 1, "("):
                end = matching(content, k + 1)
                text = clean(literal(content[k + 2 : end]))
                if text is None or PLACEHOLDER in text:
                    return None, {}
                options.append(text)
                if is_punct(content, end + 1, ".") and is_ident(content, end + 2, "tag"):
                    tag = content[end + 4 : matching(content, end + 3)]
                    if is_punct(tag, 0, "."):
                        tag = tag[1:]
                    if tag:
                        values.setdefault(tag[0].value, text)
                k = end + 1
                continue
            k += 1
        return dedupe(options) or None, values

    def format_default(self, prop, kind):
        _, (value_kind, value) = prop
        if value_kind == "bool":
            return "On" if value == "true" else "Off"
        if kind == "Toggle":
            return None
        if value_kind == "number" and kind == "Stepper":
            return value.replace("_", "")
        if value_kind == "string" and value:
            return clean(value)
        return None


def new_section():
    return {"header": None, "footer": None, "items": []}


def add_item(section, item):
    for existing in section["items"]:
        if existing["label"] == item["label"] and existing["type"] == item["type"]:
            return
    section["items"].append(item)


def dedupe(values):
    seen = set()
    result = []
    for value in values:
        if value not in seen:
            seen.add(value)
            result.append(value)
    return result


BRANDS = {
    "youtube": "YouTube",
    "obs": "OBS",
    "gopro": "GoPro",
    "dji": "DJI",
    "srt": "SRT",
    "srtla": "SRTLA",
    "rtmp": "RTMP",
    "rist": "RIST",
    "whip": "WHIP",
    "whep": "WHEP",
    "rtsp": "RTSP",
    "soop": "SOOP",
    "tts": "TTS",
    "url": "URL",
    "ble": "BLE",
}


def humanize(view):
    name = re.sub(r"(Settings)?View$", "", view)
    name = name.replace("YouTube", "Youtube").replace("GoPro", "Gopro")
    words = re.findall(r"[A-Z]+(?![a-z])|[A-Z][a-z0-9]*", name)
    words = [BRANDS.get(word.lower(), word if word.isupper() else word.lower()) for word in words]
    text = " ".join(words)
    return text[0].upper() + text[1:]


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def collapse_trivial_pages(pages):
    removed = set()
    for page in reversed(pages):
        if page["parent"] is None:
            continue
        items = [item for section in page["sections"] for item in section["items"]]
        if any(item["type"] == "page" for item in items):
            continue
        settings = [item for item in items if item["type"] != "note"]
        if len(settings) > 1:
            continue
        if settings and settings[0]["label"] not in (page["title"], "Enabled"):
            continue
        if settings and settings[0].get("options"):
            continue
        texts = [item["label"] for item in items if item["type"] == "note"]
        texts += [section["footer"] for section in page["sections"] if section["footer"]]
        if settings and settings[0].get("description"):
            texts.insert(0, settings[0]["description"])
        for other in pages:
            for section in other["sections"]:
                for item in section["items"]:
                    if item.get("page") == page["id"]:
                        del item["page"]
                        item["type"] = settings[0]["type"] if settings else "setting"
                        if settings and "default" in settings[0]:
                            item["default"] = settings[0]["default"]
                        if texts:
                            item["description"] = "\n\n".join(dedupe(texts))
        removed.add(page["id"])
    return [page for page in pages if page["id"] not in removed]


def merge_sections(page):
    unique = []
    seen = set()
    for section in page["sections"]:
        key = json.dumps(section, sort_keys=True)
        if key not in seen:
            seen.add(key)
            unique.append(section)
    page["sections"] = unique
    merged: list = []
    for section in page["sections"]:
        if (
            merged
            and not section["header"]
            and not merged[-1]["footer"]
            and not section["footer"]
            and section["items"]
            and all(item["type"] == "note" for item in section["items"])
        ):
            merged[-1]["items"] += section["items"]
            continue
        merged.append(section)
    page["sections"] = merged


def place_pages(pages):
    by_id = {page["id"]: page for page in pages}
    order = {page["id"]: index for index, page in enumerate(pages)}
    costs = {pages[0]["id"]: 0}
    queue = [(0, 0, pages[0]["id"])]
    while queue:
        cost, _, page_id = heapq.heappop(queue)
        if cost > costs[page_id]:
            continue
        page = by_id[page_id]
        for section in page["sections"]:
            step = 100 if section["header"] == "Shortcut" else 1
            for item in section["items"]:
                child = by_id.get(item.get("page"))
                if child and cost + step < costs.get(child["id"], 1_000_000):
                    costs[child["id"]] = cost + step
                    child["parent"] = page_id
                    heapq.heappush(queue, (cost + step, order[child["id"]], child["id"]))


def page_shape(page, by_id):
    return json.dumps(
        [
            [
                section["header"],
                section["footer"],
                [
                    [
                        item["type"],
                        item["label"],
                        item.get("options"),
                        item.get("description"),
                        item.get("range"),
                        by_id[item["page"]]["title"] if "page" in item else None,
                    ]
                    for item in section["items"]
                ],
            ]
            for section in page["sections"]
        ]
    )


def merge_defaults(group):
    for section_index, section in enumerate(group[0]["sections"]):
        for item_index, item in enumerate(section["items"]):
            values: dict = {}
            for page in group:
                value = page["sections"][section_index]["items"][item_index].get("default")
                values.setdefault(value, []).append(page["title"])
            if len(values) < 2:
                continue
            common = max(values.items(), key=lambda entry: len(entry[1]))[0]
            others = [
                f"{value} for {', '.join(titles)}" for value, titles in values.items() if value != common
            ]
            if common is None or None in values or sum(len(v) for k, v in values.items() if k != common) > 4:
                item.pop("default", None)
            else:
                item["default"] = f"{common} ({'; '.join(others)})"


def merge_repeated_pages(pages):
    by_id = {page["id"]: page for page in pages}
    groups: dict = {}
    for page in pages[1:]:
        parent = by_id[page["parent"]]
        for ancestor in (parent, by_id.get(parent["parent"])):
            if ancestor and ancestor["title"].endswith("s"):
                groups.setdefault((ancestor["id"], page_shape(page, by_id)), []).append(page)
    removed: dict = {}
    for (ancestor_id, _), group in groups.items():
        group = [page for page in group if page["id"] not in removed and page["sections"]]
        if len(group) < 3 or any(removed.get(page["id"]) for page in group):
            continue
        merge_defaults(group)
        keep = group[0]
        names = [page["title"] for page in group]
        if len({page["parent"] for page in group}) > 1:
            names = [f"{by_id[page['parent']]['title']} {page['title'].lower()}" for page in group]
        titles = ", ".join(names)
        keep["title"] = by_id[ancestor_id]["title"][:-1]
        keep["sections"].insert(
            0,
            {"header": None, "footer": None, "items": [{"type": "note", "label": f"The same for {titles}."}]},
        )
        for page in group[1:]:
            removed[page["id"]] = keep["id"]
    for page in pages:
        if page["parent"] in removed:
            page["parent"] = removed[page["parent"]]
        for section in page["sections"]:
            for item in section["items"]:
                if item.get("page") in removed:
                    item["page"] = removed[item["page"]]
    pages[:] = [page for page in pages if page["id"] not in removed]


def name_pages(pages):
    by_id = {page["id"]: page for page in pages}
    for page in pages[1:]:
        path = [page["title"]]
        parent = by_id.get(page["parent"])
        while parent:
            path.insert(0, parent["title"])
            parent = by_id.get(parent["parent"])
        page["path"] = path
    renamed: dict = {}
    taken = set()
    for page in sorted(pages, key=lambda page: len(page["path"])):
        base = slug(page["title"])
        page_id = base
        if page_id in taken and page["parent"]:
            page_id = f"{renamed[page['parent']]}-{base}"
        counter = 2
        while page_id in taken:
            page_id = f"{base}-{counter}"
            counter += 1
        taken.add(page_id)
        renamed[page["id"]] = page_id
    for page in pages:
        page["id"] = renamed[page["id"]]
        page["parent"] = renamed.get(page["parent"])
        for section in page["sections"]:
            for item in section["items"]:
                if "page" in item:
                    item["page"] = renamed[item["page"]]


def git(moblin, *args):
    return subprocess.run(
        ["git", "-C", str(moblin), *args], capture_output=True, text=True, check=True
    ).stdout.strip()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("moblin", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    structs: dict = {}
    file_structs: dict = {}
    classes: dict = {}
    enums: dict = {}
    inits: dict = {}
    arrays: dict = {}
    paths = sorted((args.moblin / "Moblin").rglob("*.swift"))
    paths += sorted((args.moblin / "Moblin Watch" / "Shared").rglob("*.swift"))
    for file, path in enumerate(paths):
        tokens = tokenize(path.read_text())
        parse_declarations(tokens, file, structs, file_structs, classes, enums, inits)
        parse_arrays(tokens, arrays)
    extractor = Extractor(structs, file_structs, classes, enums, inits, arrays)
    extractor.make_page(
        "Settings",
        "SettingsView",
        None,
        lambda page, section: extractor.walk("SettingsView", {}, page, section, ["SettingsView"]),
    )
    for page in extractor.pages:
        merge_sections(page)
    extractor.pages = collapse_trivial_pages(extractor.pages)
    for page in extractor.pages:
        linked = set()
        for section in page["sections"]:
            items = []
            for item in section["items"]:
                if item.get("page") not in linked:
                    items.append(item)
                if "page" in item:
                    linked.add(item["page"])
            section["items"] = items
        page["sections"] = [s for s in page["sections"] if s["items"] or s["footer"]]
    place_pages(extractor.pages)
    merge_repeated_pages(extractor.pages)
    place_pages(extractor.pages)
    name_pages(extractor.pages)
    output = {
        "commit": git(args.moblin, "rev-parse", "HEAD"),
        "date": git(args.moblin, "log", "-1", "--format=%cs"),
        "pages": extractor.pages,
    }
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=1) + "\n")
    count = sum(len(s["items"]) for p in extractor.pages for s in p["sections"])
    print(f"{len(extractor.pages)} pages, {count} items")


if __name__ == "__main__":
    main()
