insert into public.questions (
  number,
  track,
  category,
  prompt,
  rubric,
  example_answer,
  suggested_time,
  companies
)
values
  (
    1,
    'estimations',
    'market-sizing',
    $$Estimate annual US spending on meal kit subscriptions.$$,
    $$[
      {"id":"q1-r1","text":"Defines target population and penetration assumptions."},
      {"id":"q1-r2","text":"Breaks spending into frequency, price, and households."},
      {"id":"q1-r3","text":"Shows math clearly and sanity checks the result."}
    ]$$::jsonb,
    $$Assume 130M US households. If 5% subscribe to meal kits, that is 6.5M households. Suppose 3 orders per month at $60 each, or $180 per month. Annual spend is 6.5M * $180 * 12 = about $14B. A quick check: this is a mid single digit share of total grocery spend, which seems plausible.$$,
    10,
    ARRAY['McKinsey','BCG']
  ),
  (
    2,
    'estimations',
    'volume',
    $$Estimate the number of subway rides taken per day in a large metro like NYC.$$,
    $$[
      {"id":"q2-r1","text":"Anchors on population and commuter share."},
      {"id":"q2-r2","text":"Considers round trips and non commute rides."},
      {"id":"q2-r3","text":"Communicates assumptions and totals cleanly."}
    ]$$::jsonb,
    $$Say 8M residents. If 50% ride the subway on a typical weekday, that is 4M riders. Assume most riders take 2 rides per day for commuting, so 8M rides. Add 1M rides for tourists and off peak trips, totaling about 9M rides per day.$$,
    8,
    ARRAY['MTA','Uber']
  ),
  (
    3,
    'estimations',
    'cost-revenue',
    $$Estimate annual revenue for a single mid tier coffee shop in a busy downtown area.$$,
    $$[
      {"id":"q3-r1","text":"Estimates daily customers by time of day."},
      {"id":"q3-r2","text":"Uses average ticket size and operating days."},
      {"id":"q3-r3","text":"Checks reasonableness vs real world benchmarks."}
    ]$$::jsonb,
    $$Assume 500 customers per weekday and 300 per weekend day. Average ticket is $6. Weekly revenue is 500*5*6 + 300*2*6 = $18,600. Annual revenue is about $18,600 * 52 = $967k, roughly $1M.$$,
    8,
    ARRAY['Starbucks','Peets']
  ),
  (
    4,
    'estimations',
    'market-sizing',
    $$Estimate the number of small businesses in Canada that could buy HR software.$$,
    $$[
      {"id":"q4-r1","text":"Defines what counts as small business."},
      {"id":"q4-r2","text":"Segments by industry or employee count."},
      {"id":"q4-r3","text":"Converts total businesses into addressable buyers."}
    ]$$::jsonb,
    $$Canada has about 38M people. If 1 in 25 people is a small business owner, that is roughly 1.5M businesses. Exclude sole proprietors with no employees, say 40%, leaving about 900k potential buyers. That is the addressable market for HR software.$$,
    10,
    ARRAY['Workday','Gusto']
  ),
  (
    5,
    'behaviorals',
    'easy',
    $$Tell me about a time you made a mistake at work and how you handled it.$$,
    $$[
      {"id":"q5-r1","text":"Owns the mistake without deflecting."},
      {"id":"q5-r2","text":"Explains concrete corrective actions."},
      {"id":"q5-r3","text":"Shows learning that changed future behavior."}
    ]$$::jsonb,
    $$I shipped a report with a formula error that misreported churn. I immediately flagged it to my manager and sent a corrected version with clear deltas. I also added a peer review step to our weekly reporting checklist. Since then we have not had a repeat error.$$,
    6,
    ARRAY[]::text[]
  ),
  (
    6,
    'behaviorals',
    'medium',
    $$Describe a time you had to influence someone without authority.$$,
    $$[
      {"id":"q6-r1","text":"Explains stakeholder goals and constraints."},
      {"id":"q6-r2","text":"Uses data or shared wins to build alignment."},
      {"id":"q6-r3","text":"Shows result and relationship impact."}
    ]$$::jsonb,
    $$I needed engineering to prioritize a customer analytics fix. I met with the EM to understand tradeoffs, then built a short impact summary showing revenue risk and a low effort path. We agreed to a two day fix in the next sprint. The fix reduced ticket volume and built trust for later asks.$$,
    7,
    ARRAY[]::text[]
  ),
  (
    7,
    'behaviorals',
    'hard',
    $$Tell me about a time you led through ambiguity with conflicting stakeholders.$$,
    $$[
      {"id":"q7-r1","text":"Clarifies ambiguity and defines decision criteria."},
      {"id":"q7-r2","text":"Manages conflict and aligns on tradeoffs."},
      {"id":"q7-r3","text":"Delivers outcome and reflects on leadership."}
    ]$$::jsonb,
    $$Two teams wanted different launch dates for a pricing change. I gathered risks and defined a shared success metric: minimal churn impact with clear billing. We ran a fast test in one segment and used results to agree on a staged rollout. The launch hit targets and reduced cross team tension.$$,
    8,
    ARRAY[]::text[]
  ),
  (
    8,
    'reasoning',
    'logic',
    $$You have three light switches in one room and three bulbs in another room. You can visit the bulb room only once. How do you determine which switch controls which bulb?$$,
    $$[
      {"id":"q8-r1","text":"Uses a controlled experiment with time and heat."},
      {"id":"q8-r2","text":"Explains the mapping logic clearly."},
      {"id":"q8-r3","text":"Accounts for all three bulbs."}
    ]$$::jsonb,
    $$Turn on switch A for several minutes, then turn it off. Turn on switch B and leave it on. Go to the bulb room: the bulb that is on is B. The bulb that is off but warm is A. The bulb that is off and cold is C.$$,
    5,
    ARRAY[]::text[]
  ),
  (
    9,
    'reasoning',
    'logic',
    $$You have 9 identical coins and one counterfeit that is heavier. Using a balance scale, what is the minimum number of weighings needed to find it?$$,
    $$[
      {"id":"q9-r1","text":"Divides coins into equal groups."},
      {"id":"q9-r2","text":"Uses outcomes to eliminate groups."},
      {"id":"q9-r3","text":"States final number of weighings with reasoning."}
    ]$$::jsonb,
    $$Two weighings are enough. Weigh 3 vs 3. If one side is heavier, the counterfeit is in that group of 3; weigh 1 vs 1 within that group to find it. If the first weighing balances, the counterfeit is among the remaining 3, and a second weighing finds it.$$,
    6,
    ARRAY[]::text[]
  ),
  (
    10,
    'reasoning',
    'logic',
    $$A lily pad doubles in size every day and covers a pond in 30 days. On what day does it cover half the pond?$$,
    $$[
      {"id":"q10-r1","text":"Recognizes exponential doubling pattern."},
      {"id":"q10-r2","text":"Explains the logic in one sentence."},
      {"id":"q10-r3","text":"Provides the correct day."}
    ]$$::jsonb,
    $$Day 29. If the pad doubles each day, it must be half the pond the day before it covers the whole pond.$$,
    4,
    ARRAY[]::text[]
  )
on conflict (number) do update
set
  track = excluded.track,
  category = excluded.category,
  prompt = excluded.prompt,
  rubric = excluded.rubric,
  example_answer = excluded.example_answer,
  suggested_time = excluded.suggested_time,
  companies = excluded.companies;
