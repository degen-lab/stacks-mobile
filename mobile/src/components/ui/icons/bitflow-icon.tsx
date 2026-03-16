import Svg, {
  ClipPath,
  Defs,
  G,
  Path,
  Rect,
  type SvgProps,
} from "react-native-svg";

export function BitflowIcon({ width = 89, height = 14, ...props }: SvgProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 89 14"
      fill="none"
      {...props}
    >
      <G clipPath="url(#bitflow-clip)">
        <Path
          d="M67.7164 13.4344H61.3877V0.0234375H63.7711V11.2116H67.7164V13.4344Z"
          fill="black"
        />
        <Path
          d="M54.6038 13.4328H52.21V0.0234375H60.133V2.24603H54.6038V5.23409H56.9359V7.45667H54.6038V13.4344V13.4328Z"
          fill="black"
        />
        <Path
          d="M47.8741 13.4344H45.4779V2.24631H42.4014V0.0234375H50.9524V2.24631H47.8759V13.4344H47.8741Z"
          fill="black"
        />
        <Path
          d="M41.1469 13.4344H38.7314V0.0234375H41.1469V13.4344Z"
          fill="black"
        />
        <Path
          d="M34.7552 13.4328H29.2598V0.0234375H34.7552L37.1345 2.24603V5.23409L35.5343 6.7289L37.1345 8.22378V11.2118L34.7552 13.4344V13.4328ZM31.639 2.24603V5.61763H34.7552V2.24603H31.639ZM31.639 7.84022V11.2118H34.7552V7.84022H31.639Z"
          fill="black"
        />
        <Path
          d="M69.0723 0.0234375V13.4344H71.4581H78.1064V0.0234375H69.0723ZM75.7212 11.2116H71.4581V2.24631H75.7212V11.2132V11.2116Z"
          fill="black"
        />
        <Path
          d="M86.206 0.0234375V8.44936L85.4253 5.23472H82.8144L82.0344 8.44774V0.0234375H79.6504V13.4344H82.7741L84.1295 7.89035L85.4657 13.4344H88.5876V0.0234375H86.206Z"
          fill="black"
        />
        <Path
          d="M15.8846 0.0229492V2.70154H13.2758V4.9509H10.667V2.70154H8.05819V0.0229492H5.44943V2.70154H2.84064V4.9509H0.226562V13.4339H2.83535V11.1845H5.44413V8.50598H8.05289V11.1845H10.6617V13.4339H13.2705V11.1845H15.8793V8.50598H18.488V0.0229492H15.8793H15.8846Z"
          fill="#F78116"
        />
      </G>
      <Defs>
        <ClipPath id="bitflow-clip">
          <Rect
            width="88.4753"
            height="13.9698"
            fill="white"
            transform="translate(0.226562 0.0151367)"
          />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
