import type { MaybePromiseLike } from "@yume-chan/async";
import type { ReadableStream, TransformStream } from "@yume-chan/stream-extra";
import type { AsyncExactReadable, ExactReadable } from "@yume-chan/struct";

import type {
    ScrcpyAudioStreamMetadata,
    ScrcpyControlMessageType,
    ScrcpyDisplay,
    ScrcpyEncoder,
    ScrcpyMediaStreamPacket,
    ScrcpyOptions,
    ScrcpyOptionsListEncoders,
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
    AckClipboardHandler,
    ClipboardStream,
    ControlMessageTypes,
    createMediaStreamTransformer,
    createScrollController,
    Defaults,
    parseAudioStreamMetadata,
    parseDisplay,
    parseEncoder,
    parseVideoStreamMetadata,
    serialize,
    serializeBackOrScreenOnControlMessage,
    serializeInjectTouchControlMessage,
    setListDisplays,
    setListEncoders,
} from "./impl/index.js";

export class ScrcpyOptions2_1<TVideo extends boolean>
    implements ScrcpyOptions<Init<TVideo>>, ScrcpyOptionsListEncoders
{
    static readonly Defaults = Defaults;

    readonly value: Required<Init<TVideo>>;

    get controlMessageTypes(): readonly ScrcpyControlMessageType[] {
        return ControlMessageTypes;
    }

    #clipboard: ClipboardStream | undefined;
    get clipboard(): ReadableStream<string> | undefined {
        return this.#clipboard;
    }

    #ackClipboardHandler: AckClipboardHandler | undefined;

    constructor(init: Init<TVideo>) {
        this.value = { ...Defaults, ...init } as never;

        if (this.value.control && this.value.clipboardAutosync) {
            this.#clipboard = new ClipboardStream();
            this.#ackClipboardHandler = new AckClipboardHandler();
        }
    }

    serialize(): string[] {
        return serialize<Init<boolean>>(this.value, Defaults);
    }

    setListDisplays(): void {
        setListDisplays(this.value);
    }

    parseDisplay(line: string): ScrcpyDisplay | undefined {
        return parseDisplay(line);
    }

    setListEncoders() {
        setListEncoders(this.value);
    }

    parseEncoder(line: string): ScrcpyEncoder | undefined {
        return parseEncoder(line);
    }

    parseVideoStreamMetadata(
        stream: ReadableStream<Uint8Array>,
    ): MaybePromiseLike<ScrcpyVideoStream> {
        return parseVideoStreamMetadata(this.value, stream);
    }

    parseAudioStreamMetadata(
        stream: ReadableStream<Uint8Array>,
    ): MaybePromiseLike<ScrcpyAudioStreamMetadata> {
        return parseAudioStreamMetadata(stream, this.value);
    }

    async parseDeviceMessage(
        id: number,
        stream: ExactReadable | AsyncExactReadable,
    ): Promise<void> {
        if (await this.#clipboard?.parse(id, stream)) {
            return;
        }

        if (await this.#ackClipboardHandler?.parse(id, stream)) {
            return;
        }

        throw new Error("Unknown device message");
    }

    endDeviceMessageStream(e?: unknown): void {
        if (e) {
            this.#clipboard?.error(e);
            this.#ackClipboardHandler?.error(e);
        } else {
            this.#clipboard?.close();
            this.#ackClipboardHandler?.close();
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
    ): Uint8Array | [Uint8Array, Promise<void>] {
        return this.#ackClipboardHandler!.serializeSetClipboardControlMessage(
            message,
        );
    }

    createScrollController(): ScrcpyScrollController {
        return createScrollController();
    }
}

type Init_<TVideo extends boolean> = Init<TVideo>;

export namespace ScrcpyOptions2_1 {
    export type Init<TVideo extends boolean = boolean> = Init_<TVideo>;
}
