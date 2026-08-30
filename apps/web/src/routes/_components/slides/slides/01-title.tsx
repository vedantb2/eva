import { use } from "react";
import { motion } from "motion/react";
import { BlurWordsTitle } from "../_components/BlurWordsTitle";
import {
  SlideShell,
  SlideBody,
  SlideStepContext,
} from "../_components/SlideShell";

export function Slide01Title() {
  const step = use(SlideStepContext);
  const settled = step >= 1;

  return (
    <SlideShell center>
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          layout
          transition={{ layout: { duration: 0.7, ease: [0.4, 0, 0.2, 1] } }}
          className={settled ? "mb-6" : ""}
        >
          <span className="text-4xl font-semibold tracking-tight">Eva</span>
        </motion.div>

        {settled && (
          <>
            <BlurWordsTitle
              lines={["AI agents that", "actually ship code."]}
              size="3xl"
              delay={0.3}
            />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.5 }}
              className="mt-6 max-w-xl"
            >
              <SlideBody>
                Connect your GitHub repos. Describe the work. Eva spins up a
                sandbox, makes the changes, runs your tests, and opens a PR.
              </SlideBody>
            </motion.div>
          </>
        )}
      </div>

      {settled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="absolute bottom-10 left-0 right-0 flex justify-center"
        >
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted/60">
            Vedant Bhopatrao
          </p>
        </motion.div>
      )}
    </SlideShell>
  );
}
