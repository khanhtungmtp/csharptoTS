import * as vscode from 'vscode';
import * as types from './types';
import { ExtensionCs2TsConfig } from "./config";

import { CSharpProperty } from "./properties";
import { CSharpMethod, CSharpParameter, CSharpConstructor, CSharpRecord } from "./methods";
import { CSharpClass } from "./classes";

function generateType(type: string, config: ExtensionCs2TsConfig): string {
    const parseType = types.parseType(type);
    return trimMemberName(parseType ? types.convertToTypescript(parseType, config) : type, config);
}

function generateParam(value: CSharpParameter, separator: string, config: ExtensionCs2TsConfig): string {
    const tsType = generateType(value.type, config);
    return value.name + ": " + tsType + value.spaceBeforeComma + separator + value.spaceAfterComma;
}

function generateControllerBody(name: string, params: CSharpParameter[]): string {
    const isUriSimpleType = (x: CSharpParameter) => {
        const parseType = types.parseType(x.type);
        return parseType && types.isUriSimpleType(parseType);
    };

    const simpleParams = params.filter(isUriSimpleType).map(x => x.name).join(", ");
    const bodyParams = params.filter(x => !isUriSimpleType(x)).map(x => x.name).join(", ");

    if (bodyParams.length === 0) {
        return ` => await controller('${name}', {${simpleParams}}), `;
    } else {
        return ` => await controller('${name}', {${simpleParams}}, ${bodyParams}), `;
    }
}

export function generateMethod(value: CSharpMethod, config: ExtensionCs2TsConfig): string {
    const paramList = value.parameters.map((x, i) => generateParam(x, i === (value.parameters.length - 1) ? "" : ",", config)).join("");
    const returnType = generateType(value.returnType, config);

    const fullType = "(" + paramList + "): " + returnType;
    const lambdaBody = (value.name + ": " + (value.async ? "async " : "")) + fullType;

    return (
        config.methodStyle === "signature" ? (value.name + fullType + ";") :
            config.methodStyle === "lambda" ? lambdaBody + " => { throw new Error('TODO'); }, " :
                config.methodStyle === "controller" ? lambdaBody + generateControllerBody(value.name, value.parameters)
                    : config.methodStyle
    );
}


export function generateConstructor(value: CSharpConstructor, config: ExtensionCs2TsConfig): string {
    const paramList = value.parameters.map((x, i) => generateParam(x, i === (value.parameters.length - 1) ? "" : ",", config)).join("");
    return config.removeConstructors ? "" : ("new(" + paramList + "): " + value.name + ";");
}

const myClass = {
    myMethod: (hola: boolean): string => {
        throw new Error("TODO: Implement me");
    }
};

export function generateRecord(value: CSharpRecord, config: ExtensionCs2TsConfig): string {
    const paramList = value.parameters.map(x => generateParam(x, ";", config)).join("");

    const signature = generateClass({
        name: value.name,
        inherits: [],
        isPublic: value.isPublic,
        type: "class"
    }, config);

    const full = signature + value.spaceAfterOpenPar + paramList + "}";
    return full;
}


/**Generate a typescript property */
export function generateProperty(prop: CSharpProperty, config: ExtensionCs2TsConfig): string {
    //trim spaces:
    const tsType = generateType(prop.type, config);
    const name = getTypescriptPropertyName(prop.name, config);
    const printInitializer = !config.ignoreInitializer && (!!prop.initializer);

    const removeNameRegex = config.removeNameRegex !== "" && (new RegExp(config.removeNameRegex)).test(name);
    const removeModifier = config.removeWithModifier.indexOf(prop.modifier) !== -1;
    const removeProp = removeNameRegex || removeModifier;
    const modifier = prop.modifier; //TODO: Convert C# modifiers to TS modifiers
    if (removeProp) {
        return "";
    }

    return (
        (
            config.preserveModifiers ? (modifier + " ") : ""
        ) +
        (printInitializer ?
            (name + ": " + tsType + " = " + prop.initializer + ";") :
            (name + ": " + tsType + ";"))
    );
}

export function generateClass(x: CSharpClass, config: ExtensionCs2TsConfig): string {
    const inheritsTypes = x.inherits.map(x => generateType(x, config));
    const name = x.name;
    const modifier = (x.isPublic ? "export " : "");
    const keyword = config.classToInterface ? "interface" : "class";
    const prefix = `${modifier}${keyword} ${name}`;
    if (inheritsTypes.length > 0) {
        return `${prefix} extends ${inheritsTypes.join(", ")} {`;
    } else {
        return `${prefix} {`;
    }
}

export function getTypescriptPropertyName(name: string, config: ExtensionCs2TsConfig) {
    var isAbbreviation = name.toUpperCase() === name;
    name = trimMemberName(name, config);
    if (config.keepAbbreviation && isAbbreviation) {
        if (name.includes('_')) {
            const parts: string[] = name.split('_');
            if (parts.length > 1) {
                if (parts[0].length < 2) {
                  parts[0] = parts[0].toLowerCase();
                } else {
                  parts[0] = convertLastCharToLowerCase(parts[0]);
                }
                // Ghép các phần lại thành chuỗi mới
                return parts.join('_');
              }
          
       }else{
        return name.toLowerCase();
       }
    }
    if (config.propertiesToCamelCase && !isAbbreviation) {
        /** TH KO VIET HOA HOAN TOAN NHUNG INCLUDE _ VA TRUOC _ VIET HOA HOAN TOAN */
        if (name.includes('_')) {
            const parts: string[] = name.split('_');
            if (parts.length > 1) {
                if (parts[0].length > 2 && parts[0].toUpperCase() === parts[0]) {
                    parts[0] = convertLastCharToLowerCase(parts[0]);
                }
                // Ghép các phần lại thành chuỗi mới
                return parts.join('_');
            }

        }
        if (config.propertiesToTitleCase && hasConsecutiveUppercase(name)) {
            // TRUONG HOP TITLECase: TUNGMtp
            // name: KPINew
            const part0 = convertToTitleCase(name); // KPI
            const part1 = name.slice(part0.length); // New
            return part0.toLowerCase().concat(part1); // kpiNew
        }
        return name[0].toLowerCase() + name.substring(1);
    }
    return name;
}

function hasConsecutiveUppercase(input: string): boolean {
    return /[A-Z]{2,}(?=[a-z])/.test(input);
}

function convertToTitleCase(input: string): string {
    const consecutiveUppercaseMatches = input.match(/[A-Z]+(?=[a-z])/g);

    if (consecutiveUppercaseMatches) {
        // Lấy chữ cái viết hoa gần cuối cùng
        const lastUppercase = consecutiveUppercaseMatches[consecutiveUppercaseMatches.length - 1];

        // Loại bỏ chữ cái cuối cùng
        return lastUppercase.slice(0, -1);
    }
    return input;
}

function convertLastCharToLowerCase(input: string): string {
    if (input.trim() !== '') {
        // Lấy chiều dài của chuỗi
        const length: number = input.length;

        // Chuyển đổi chữ cái cuối cùng thành chữ thường
        const lastChar: string = input[length - 1].toUpperCase();

        // Tạo chuỗi mới bằng cách ghép chuỗi cũ và chữ cái cuối cùng đã chuyển đổi
        return input.substring(0, length - 1).toLowerCase() + lastChar;
    }

    return input;
}

export function trimMemberName(name: string, config: ExtensionCs2TsConfig): string {
    name = name.trim();

    var postfixes = config.trimPostfixes;
    if (!postfixes) { return name; }
    var trimRecursive = config.recursiveTrimPostfixes;

    var trimmed = true;
    do {
        trimmed = false;

        for (let postfix of postfixes) {
            if (!name.endsWith(postfix)) { continue; }

            name = trimEnd(name, postfix);
            if (!trimRecursive) { return name; }

            trimmed = true;
        }
    } while (trimmed); // trim recursive until no more occurrences will be found

    return name;
}

function trimEnd(text: string, postfix: string) {
    if (text.endsWith(postfix)) {
        return text.substring(0, text.length - postfix.length);
    }
    return text;
}