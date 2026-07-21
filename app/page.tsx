import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
// import { Services2 } from "@/components/Services2";
// import { WhyUs } from "@/components/WhyUs";
// import { WhyUs2 } from "@/components/WhyUs2";
import { WhyChooseUs } from "@/components/WhyChooseUs";
import { BookingPreview } from "@/components/BookingPreview";
// import { CTABanner } from "@/components/CTABanner";
import { CtaBanner2 } from "@/components/CtaBanner2";
import { Testimonials } from "@/components/Testimonials";
import { WelcomePopup } from "@/components/WelcomePopup";

export default function Home() {
  return (
    <>
      {/* <Navbar /> */}
      <WelcomePopup />
      <Navbar></Navbar>
      <Hero></Hero>
      <Services></Services>
      {/* <WhyUs></WhyUs> */}
      {/* <WhyUs2></WhyUs2>// */}
      <WhyChooseUs></WhyChooseUs>
      <BookingPreview></BookingPreview>
      {/* <CTABanner></CTABanner> */}
      <CtaBanner2></CtaBanner2>
      <Testimonials></Testimonials>
      {/* <Services2></Services2> */}
      <Footer />
    </>
  );
}
