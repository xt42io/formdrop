import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

interface OTPEmailProps {
  otp: string;
}

export const OTPEmail = ({ otp }: OTPEmailProps) => (
  <Html>
    <Head />
    <Preview>Your verification code</Preview>
    <Tailwind>
      <Body className="bg-white font-sans">
        <Container className="mx-auto py-5 pb-12 max-w-[560px]">
          <Heading className="text-2xl font-bold my-10 p-0 text-center">
            Verification Code
          </Heading>
          <Text className="text-[#333] text-base leading-[26px]">
            Your verification code is below. Enter this code to complete your
            authentication.
          </Text>
          <Section className="bg-[rgba(0,0,0,0.05)] rounded-md my-4 align-middle w-[280px] mx-auto">
            <Text className="text-black inline-block font-mono text-[32px] font-bold tracking-[6px] leading-10 py-2 w-full text-center m-0">
              {otp}
            </Text>
          </Section>
          <Text className="text-[#333] text-base leading-[26px]">
            If you didn't request this code, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default OTPEmail;
