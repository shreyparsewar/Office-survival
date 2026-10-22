import { Composition } from "remotion";
import { OfficePromo } from "./OfficePromo";

export const RemotionRoot: React.FC = () => (
  <Composition id="OfficeSurvival1999" component={OfficePromo} durationInFrames={600} fps={30} width={1920} height={1080} />
);
