import json

declaration = 1

# int total(int num)
def read_head(line):
    words = ["", "", "", ""]
    i = 0
    for char in line:
        if char != ' ' and char != '(' and char != ')':
            words[i] = words[i] + str(char)
        else:
            i = i + 1
            if char == ")":
                break
    return words


# int sum=0;
def read_declaration(line):
    global declaration
    words = ["", "", ""]
    i = 0
    for char in line:
        if char != ' ' and char != '=' and char != ';':
            words[i] = words[i] + str(char)
        else:
            i = i + 1
    declaration = declaration + 1
    obj = {
        "codeType": "declaration",
        "dataType": words[0],
        "dataName": words[1],
        "dataValue": words[2],
        "address": -(declaration*4)
    }

    return obj


# sum=sum+num;
def read_logic(line):
    words = ["", "", "",""]
    i = 0
    for char in line:
        if char == '+' or char == '-' or char == '/':
            i = i + 1
            words[i] = str(char)
            i = i + 1
        elif char != '=' and char != ';':
            words[i] = words[i] + str(char)
        else:
            i = i + 1
    obj = {
        "codeType": "logicOperation",
        "destination": words[0],
        "operand1": words[1],
        "operator": words[2],
        "operand2": words[3]
    }
    return obj


# read instructions recursively
def read_instruction(i, segment):
    instruction = []
    while i < len(segment):
        line = segment[i]
        if line == "}":
            break
        if line.startswith("int"):
            instruction.append(read_declaration(line))
            i = i + 1
        elif line.startswith("for"):
            result = read_for_loop(i, segment)
            instruction.append(result["for"])
            i = result["i"]
        elif line.startswith("return"):
            instruction.append(line)
            i = i + 1
        else:
            instruction.append(read_logic(line))
            i = i + 1
    return {"i": i+1, "statement": instruction}


# for(int i=0;i<num;i=i+1)
def read_for_loop(i, segment):
    line = segment[i]
    header = line[4:-2].split(';')
    obj = {"codeType": "for",
           "initialization": read_declaration(header[0]+";"),
           "termination": header[1],
           "increment": read_logic(header[2]+";"),
           "statement": []
           }
    i = i + 1
    result = read_instruction(i, segment)
    obj["statement"] = result["statement"]
    return {"i": result["i"], "for": obj}


source = [
    "int total(int num){",
    "int sum=0;",
    "for(int i=0;i<num;i=i+1){",
    "sum=sum+a;",
    "}",
    "return sum;",
    "}"
]

functionClass = {
    "returnType": "",
    "functionName": "",
    "parameter": {
        "type": "",
        "name": ""
    },
    "instruction": [

    ]

}

head = read_head(source[0])
functionClass["returnType"] = head[0]
functionClass["functionName"] = head[1]
functionClass["parameter"] = {
    "type": head[2],
    "name": head[3],
    "codeType": "declaration",
    "address": -(declaration*4)
}
# ignore the first line
functionClass["instruction"] = read_instruction(1, source)["statement"]
final_result = json.dumps(functionClass, indent=4)
print(final_result)