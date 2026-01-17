function Heading() {
  return (
    <div className="h-[60px] relative shrink-0 w-[334px]" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute css-4hzbpn font-['Inter:Regular',sans-serif] font-normal leading-[30px] left-0 not-italic text-[24px] text-white top-[-1px] w-[288px]">Purpose-built for product development</p>
      </div>
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d="M8 3.5V12.5M3.5 8H12.5" id="Vector" stroke="var(--stroke-0, #9F9FA9)" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="relative rounded-[33554400px] shrink-0 size-[32px]" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#3f3f46] border-solid inset-0 pointer-events-none rounded-[33554400px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center p-px relative size-full">
        <Icon />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex h-[68px] items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Heading />
      <Button />
    </div>
  );
}

function HeroCard() {
  return (
    <div className="h-[134px] relative rounded-[24px] shrink-0 w-[448px]" data-name="HeroCard" style={{ backgroundImage: "linear-gradient(163.348deg, rgb(24, 24, 27) 0%, rgb(24, 24, 27) 50%, rgb(39, 39, 42) 100%)" }}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip pb-px pt-[33px] px-[33px] relative rounded-[inherit] size-full">
        <Container />
      </div>
      <div aria-hidden="true" className="absolute border border-[#27272a] border-solid inset-0 pointer-events-none rounded-[24px]" />
    </div>
  );
}

export default function BlankCardComponentCopy() {
  return (
    <div className="bg-black content-stretch flex items-center justify-center relative size-full" data-name="Blank Card Component (Copy)">
      <HeroCard />
    </div>
  );
}