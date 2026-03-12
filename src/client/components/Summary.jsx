import React, { useMemo, useEffect } from "react";
import empIcon from "../../assets/icons/employees.png";
import salaryIcon from "../../assets/icons/avg-salary.png";
import incIcon from "../../assets/icons/avg-increment.png";
import incSalaryIcon from "../../assets/icons/avg-incremented.png";
import { motion } from "framer-motion";

function Summary({ employees }) {
  const stats = useMemo(() => {
    if (!employees || employees.length === 0) {
      return {
        count: 0,
        avgSalary: 0,
        avgIncrement: 0,
        avgIncSalary: 0,
      };
    }

    const salaries = employees
      .map((e) => e.currentsalary)
      .filter((s) => s !== null && s !== undefined && !isNaN(s));

    const increments = employees
      .map((e) => e.increment)
      .filter((i) => i !== null && i !== undefined && !isNaN(i));

    const incSalaries = employees
      .map((e) => e.incrementedsalary)
      .filter((s) => s !== null && s !== undefined && !isNaN(s));

    return {
      count: employees.length,
      avgSalary:
        salaries.length > 0
          ? salaries.reduce((a, b) => a + Number(b), 0) / salaries.length
          : 0,
      avgIncrement:
        increments.length > 0
          ? increments.reduce((a, b) => a + Number(b), 0) / increments.length
          : 0,
      avgIncSalary:
        incSalaries.length > 0
          ? incSalaries.reduce((a, b) => a + Number(b), 0) / incSalaries.length
          : 0,
    };
  }, [employees]);

  const formatMoney = (n) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(n);
  };
  useEffect(() => {
    const cards = document.querySelectorAll("#summary .card");

    const move = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
      e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
    };

    cards.forEach((card) => card.addEventListener("mousemove", move));

    return () => {
      cards.forEach((card) => card.removeEventListener("mousemove", move));
    };
  }, [employees]);
  return (
    <motion.section
      id="summary"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.12,
          },
        },
      }}
    >
      <motion.div
  className="card"
  variants={{
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1 },
  }}
  transition={{ duration: 0.35 }}
>

  <img src={empIcon} className="card-icon" alt="employees" />

  <div className="k">Employees</div>
  <div className="v" id="sum-count">
    {stats.count}
  </div>

</motion.div>
     <motion.div
  className="card"
  variants={{
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1 },
  }}
  transition={{ duration: 0.35 }}
>
  <img src={salaryIcon} className="card-icon" alt="salary"/>

  <div className="k">Avg Salary</div>
  <div className="v" id="sum-avg-sal">
    {formatMoney(stats.avgSalary)}
  </div>
</motion.div>
    <motion.div
  className="card"
  variants={{
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1 },
  }}
  transition={{ duration: 0.35 }}
>
  <img src={incIcon} className="card-icon" alt="increment"/>

  <div className="k">Avg Increment %</div>
  <div className="v" id="sum-avg-inc">
    {stats.avgIncrement ? stats.avgIncrement.toFixed(2) : "0"}
  </div>
</motion.div>
    <motion.div
  className="card"
  variants={{
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1 },
  }}
  transition={{ duration: 0.35 }}
>
  <img src={incSalaryIcon} className="card-icon" alt="incremented salary"/>

  <div className="k">Avg Incremented</div>
  <div className="v" id="sum-avg-incsal">
    {formatMoney(stats.avgIncSalary)}
  </div>
</motion.div>
    </motion.section>
  );
}

export default Summary;
