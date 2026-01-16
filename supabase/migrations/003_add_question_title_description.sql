alter table public.questions
  add column if not exists title text,
  add column if not exists description text;

update public.questions
set
  title = case number
    when 1 then $$Meal Kits$$
    when 2 then $$Subway Rides$$
    when 3 then $$Coffee Shop$$
    when 4 then $$HR Software$$
    when 5 then $$Owning Mistakes$$
    when 6 then $$Influence Without Authority$$
    when 7 then $$Leading Ambiguity$$
    when 8 then $$Light Switches$$
    when 9 then $$Heavy Coin$$
    when 10 then $$Lily Pad$$
    else title
  end,
  description = case number
    when 1 then $$Estimate total annual US spending on meal kit subscriptions. Clarify whether you include only subscription boxes or any on-demand kits, and state assumptions on penetration, orders per month, and average order value.$$
    when 2 then $$Estimate daily subway rides in a large metro like NYC. Use population, commuter share, average trips per rider, and add a small adjustment for tourists and off-peak travel.$$
    when 3 then $$Estimate annual revenue for a mid-tier downtown coffee shop. Consider weekday vs weekend traffic, average ticket size, operating days, and sanity-check against similar cafes.$$
    when 4 then $$Estimate how many small businesses in Canada could buy HR software. Define the employee range, exclude sole proprietors, and consider adoption.$$
    when 5 then $$Share a specific mistake you made at work, how you corrected it, and what process change you adopted so it did not happen again.$$
    when 6 then $$Describe a time you influenced a stakeholder without formal authority. Explain their incentives, how you persuaded them, and the outcome.$$
    when 7 then $$Tell a story about leading through ambiguity with conflicting stakeholders. Highlight how you created clarity, aligned on tradeoffs, and delivered a result.$$
    when 8 then $$Three switches control three bulbs in another room. You can enter the bulb room once. Explain the steps you take to map each switch to a bulb.$$
    when 9 then $$Nine identical coins include one heavier counterfeit. Use a balance scale to find it in the minimum number of weighings and explain the logic.$$
    when 10 then $$A lily pad doubles daily and covers a pond on day 30. What day is it half covered, and why?$$
    else description
  end
where number between 1 and 10;

update public.questions
set
  title = coalesce(title, prompt),
  description = coalesce(description, prompt)
where title is null or description is null;

alter table public.questions
  alter column title set not null,
  alter column description set not null;
