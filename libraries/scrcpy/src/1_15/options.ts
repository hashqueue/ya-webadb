import type { MaybePromiseLike } from "@yume-chan/async";
import type { ReadableStream, TransformStream } from "@yume-chan/stream-extra";
import type { AsyncExactReadable, ExactReadable } from "@yume-chan/struct";

import type {
    ScrcpyControlMessageType,
    ScrcpyDisplay,
    ScrcpyMediaStreamPacket,
    ScrcpyOptions,
    ScrcpyScrollController,
    ScrcpyVideoStream,
} from "../base/index.js";
import type {
    ScrcpyBackOrScreenOnControlMessage,
    ScrcpyInjectTouchControlMessage,
    ScrcpySetClipboardControlMessage,
} from "../latest.js";

import type { Init } from "./impl/index.js";
import {
    ClipboardStream,
    ControlMessageTypes,
    createMediaStreamTransformer,
    createScrollController,
    Defaults,
    parseDisplay,
    parseVideoStreamMetadata,
    serialize,
    serializeBackOrScreenOnControlMessage,
    serializeInjectTouchControlMessage,
    SerializeOrder,
    serializeSetClipboardControlMessage,
    setListDisplays,
} from "./impl/index.js";

export class ScrcpyOptions1_15 implements ScrcpyOptions<Init> {
    static readonly Defaults = Defaults;

    readonly value: Required<Init>;

    get controlMessageTypes(): readonly ScrcpyControlMessageType[] {
        return ControlMessageTypes;
    }

    #clipboard: ClipboardStream | undefined;
    get clipboard(): ReadableStream<string> | undefined {
        return this.#clipboard;
    }

    constructor(init: Init) {
        this.value = { ...Defaults, ...init };

        if (this.value.control) {
            this.#clipboard = new ClipboardStream();
        }
    }

    serialize(): string[] {
        return serialize(this.value, SerializeOrder);
    }

    setListDisplays(): void {
        setListDisplays(this.value);
    }

    parseDisplay(line: string): ScrcpyDisplay | undefined {
        return parseDisplay(line);
    }

    parseVideoStreamMetadata(
        stream: ReadableStream<Uint8Array>,
    ): MaybePromiseLike<ScrcpyVideoStream> {
        return parseVideoStreamMetadata(stream);
    }

    async parseDeviceMessage(
        id: number,
        stream: ExactReadable | AsyncExactReadable,
    ): Promise<void> {
        if (await this.#clipboard!.parse(id, stream)) {
            return;
        }

        throw new Error("Unknown device message");
    }

    endDeviceMessageStream(e?: unknown): void {
        if (e) {
            this.#clipboard!.error(e);
        } else {
            this.#clipboard!.close();
        }
    }

    createMediaStreamTransformer(): TransformStream<
        Uint8Array,
        ScrcpyMediaStreamPacket
    > {
        return createMediaStreamTransformer(this.value);
    }

    serializeInjectTouchControlMessage(
        message: ScrcpyInjectTouchControlMessage,
    ): Uint8Array {
        return serializeInjectTouchControlMessage(message);
    }

    serializeBackOrScreenOnControlMessage(
        message: ScrcpyBackOrScreenOnControlMessage,
    ): Uint8Array | undefined {
        return serializeBackOrScreenOnControlMessage(message);
    }

    serializeSetClipboardControlMessage(
        message: ScrcpySetClipboardControlMessage,
    ): Uint8Array {
        return serializeSetClipboardControlMessage(message);
    }

    createScrollController(): ScrcpyScrollController {
        return createScrollController();
    }
}

type Init_ = Init;

export namespace ScrcpyOptions1_15 {
    export type Init = Init_;
}
