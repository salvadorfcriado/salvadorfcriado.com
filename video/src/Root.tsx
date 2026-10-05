import React from "react";
import { Composition } from "remotion";
import { DURATION, FPS, H, W } from "./theme";
import { Voice } from "./scenes/Voice";
import { Docs } from "./scenes/Docs";
import { Billing } from "./scenes/Billing";
import { Assistant } from "./scenes/Assistant";
import { Infra } from "./scenes/Infra";
import { Custom } from "./scenes/Custom";
import type { Lang } from "./strings";

/* One composition per service × language: `voice-es`, `voice-en`, … — the id
   is the output file name under public/video/. */
export const SCENES = { voice: Voice, docs: Docs, billing: Billing, assistant: Assistant, infra: Infra, custom: Custom } as const;
const LANGS: Lang[] = ["es", "en"];

export const RemotionRoot: React.FC = () => (
  <>
    {Object.entries(SCENES).flatMap(([id, Scene]) =>
      LANGS.map((lang) => (
        <Composition
          key={`${id}-${lang}`}
          id={`${id}-${lang}`}
          component={Scene as React.FC<{ lang: Lang }>}
          durationInFrames={DURATION}
          fps={FPS}
          width={W}
          height={H}
          defaultProps={{ lang }}
        />
      )),
    )}
  </>
);
