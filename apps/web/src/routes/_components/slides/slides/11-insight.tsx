import {
  SlideShell,
  SlideBody,
} from "../_components/SlideShell";
import { BlurWordsTitle } from "../_components/BlurWordsTitle";

export function Slide11Insight() {
  return (
    <SlideShell center>
      <BlurWordsTitle
        lines={["Agents need execution,", "not just generation."]}
        size="3xl"
      />
      <SlideBody className="mt-8 max-w-xl text-center">
        They need to run npm install. Run your build. See if the tests pass.
        That's what makes the difference between "here's a diff" and "here's
        working code".
      </SlideBody>
    </SlideShell>
  );
}
