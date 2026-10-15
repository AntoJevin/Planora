import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from "expo-web-browser";
import { type ComponentProps } from "react";
import { Linking, Text } from "react-native";

type Props = Omit<ComponentProps<typeof Text>, "onPress"> & { href: string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Text
      {...rest}
      onPress={async () => {
        if (process.env.EXPO_OS !== "web") {
          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        } else {
          await Linking.openURL(href);
        }
      }}
    />
  );
}
