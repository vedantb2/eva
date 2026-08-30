import { use } from "react";
import { motion } from "motion/react";
import {
  SlideShell,
  SlideBody,
  SlideStepContext,
} from "../_components/SlideShell";
import { BlurWordsTitle } from "../_components/BlurWordsTitle";

export function Slide13Closing() {
  const step = use(SlideStepContext);

  return (
    <SlideShell center>
      <BlurWordsTitle lines={["Thank you."]} size="4xl" />

      {step >= 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 space-y-3 text-center"
        >
          <SlideBody>eva.vedantb.com</SlideBody>
          <SlideBody>github.com/vvedantb/eva</SlideBody>
          <p className="text-sm text-muted">MIT open source</p>
        </motion.div>
      )}
    </SlideShell>
  );
}
