import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import {
  Zap,
  BarChart2,
  Lock,
  Briefcase,
  Users,
  Award,
  Target,
  ArrowRight,
  CheckCircle,
  PieChart as PieChartIcon,
  Shield,
  UserPlus
} from 'lucide-react';

interface PieChartProps {
  cx: number | string;
  cy: number | string;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: {
    name: string;
    value: number;
  };
  percent: number;
  value: number;
}

interface ChartEvent {
  name: string;
  value: number;
  payload: {
    name: string;
    value: number;
  };
}

const App = () => {
  const [activeTab, setActiveTab] = useState('gameMode');
  const [animateCustomers, setAnimateCustomers] = useState(false);
  const [customerCount, setCustomerCount] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [investmentAmount, setInvestmentAmount] = useState(0);
  const [equityPercentage, setEquityPercentage] = useState(10);
  const [agentsPerCustomer, setAgentsPerCustomer] = useState(1.8);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [extraMinutesPerAgent, setExtraMinutesPerAgent] = useState(300);
  const [subscriptionMix, setSubscriptionMix] = useState({
    base: 30,      // 30% of customers on Base plan
    premium: 60,   // 60% of customers on Premium plan  
    corporate: 10  // 10% of customers on Corporate plan
  });
  const [monthlyCustomerTargets, setMonthlyCustomerTargets] = useState([
    4, 8, 12, 18, 25, 35, 45, 60, 75, 95, 120, 150  // Customers acquired each month
  ]);
  const [monthlyOperatingCosts, setMonthlyOperatingCosts] = useState(5000); // Monthly costs excluding salaries
  
  // Pricing plans
  const pricingPlans = {
    base: {
      name: 'Base',
      price: 114, // AUD per month per agent
      includedMinutes: 180,
      description: 'For Individual. Perfect for getting started.'
    },
    premium: {
      name: 'Premium',
      price: 163, // AUD per month per agent
      includedMinutes: 180,
      description: 'For Startups. Most popular for growing teams.'
    },
    corporate: {
      name: 'Corporate',
      price: 327, // AUD per month per agent
      includedMinutes: 300,
      description: 'For enterprises and large teams.'
    }
  };

  const extraMinuteRate = 0.55; // AUD per minute
  
  // Calculate sophisticated revenue metrics with subscription mix
  const calculateSophisticatedRevenue = useCallback((customers: number, agentsPerCust: number, plan: string, extraMins: number, mix?: any) => {
    // If mix is provided, calculate blended revenue across all plans
    if (mix && customers > 0) {
      const baseCustomers = Math.round(customers * (mix.base / 100));
      const premiumCustomers = Math.round(customers * (mix.premium / 100));
      const corporateCustomers = customers - baseCustomers - premiumCustomers; // Ensure total adds up
      
      const baseAgents = baseCustomers * agentsPerCust;
      const premiumAgents = premiumCustomers * agentsPerCust;
      const corporateAgents = corporateCustomers * agentsPerCust;
      
      // Calculate revenue for each plan
      const baseRevenue = baseAgents * pricingPlans.base.price;
      const premiumRevenue = premiumAgents * pricingPlans.premium.price;
      const corporateRevenue = corporateAgents * pricingPlans.corporate.price;
      
      const totalBaseRevenue = baseRevenue + premiumRevenue + corporateRevenue;
      
      // Extra minutes revenue (blended across all plans)
      const totalAgents = customers * agentsPerCust;
      const extraMinutesRevenue = totalAgents * extraMins * extraMinuteRate;
      
      const totalMonthlyRevenue = totalBaseRevenue + extraMinutesRevenue;
      const annualRevenue = totalMonthlyRevenue * 12;
      
      return {
        baseMonthly: totalBaseRevenue,
        extraMinutesMonthly: extraMinutesRevenue,
        totalMonthly: totalMonthlyRevenue,
        annual: annualRevenue,
        perCustomer: totalMonthlyRevenue / (customers || 1),
        perAgent: totalMonthlyRevenue / (totalAgents || 1),
        breakdown: {
          base: { customers: baseCustomers, revenue: baseRevenue },
          premium: { customers: premiumCustomers, revenue: premiumRevenue },
          corporate: { customers: corporateCustomers, revenue: corporateRevenue }
        }
      };
    }
    
    // Fallback to single plan calculation
    const selectedPlanData = pricingPlans[plan as keyof typeof pricingPlans];
    const totalAgents = customers * agentsPerCust;
    
    // Base subscription revenue
    const baseMonthlyRevenue = totalAgents * selectedPlanData.price;
    
    // Extra minutes revenue
    const extraMinutesRevenue = totalAgents * extraMins * extraMinuteRate;
    
    // Total monthly revenue
    const totalMonthlyRevenue = baseMonthlyRevenue + extraMinutesRevenue;
    const annualRevenue = totalMonthlyRevenue * 12;
    
    return {
      baseMonthly: baseMonthlyRevenue,
      extraMinutesMonthly: extraMinutesRevenue,
      totalMonthly: totalMonthlyRevenue,
      annual: annualRevenue,
      perCustomer: totalMonthlyRevenue / (customers || 1),
      perAgent: totalMonthlyRevenue / (totalAgents || 1)
    };
  }, [pricingPlans, extraMinuteRate]);

  // Calculate 12-month cashflow timeline using monthly customer targets
  const calculateCashflowTimeline = useCallback((monthlyTargets: number[], agentsPerCust: number, extraMins: number, mix: any, costs: number) => {
    const timeline = [];
    const founderSalaryMonthly = (70000 / 12); // $5,833 per founder per month
    const totalSalaryMonthly = founderSalaryMonthly * 2; // Both founders
    
    let cumulativeCustomers = 0;
    
    for (let month = 1; month <= 12; month++) {
      // Get customers acquired this month from the targets array
      const newCustomersThisMonth = monthlyTargets[month - 1] || 0;
      cumulativeCustomers += newCustomersThisMonth;
      
      // Calculate revenue for cumulative customers
      const revenue = calculateSophisticatedRevenue(cumulativeCustomers, agentsPerCust, 'premium', extraMins, mix);
      
      // Calculate costs
      const operatingCosts = costs;
      const totalCosts = operatingCosts;
      
      // Calculate profit before salaries
      const profitBeforeSalaries = revenue.totalMonthly - totalCosts;
      
      // Check if we can afford salaries
      const canAffordSalaries = profitBeforeSalaries >= totalSalaryMonthly;
      const profitAfterSalaries = canAffordSalaries ? profitBeforeSalaries - totalSalaryMonthly : profitBeforeSalaries;
      
      timeline.push({
        month,
        newCustomers: newCustomersThisMonth,
        customers: cumulativeCustomers,
        revenue: revenue.totalMonthly,
        operatingCosts,
        profitBeforeSalaries,
        salaryAffordable: canAffordSalaries,
        salaryAmount: canAffordSalaries ? totalSalaryMonthly : 0,
        profitAfterSalaries,
        cumulativeProfit: timeline.length > 0 ? timeline[timeline.length - 1].cumulativeProfit + profitAfterSalaries : profitAfterSalaries
      });
    }
    
    return timeline;
  }, [calculateSophisticatedRevenue]);
  
  // Calculate company valuation based on investment terms and customer growth
  const calculateCompanyValuation = useCallback((investment: number, equityPct: number, customers: number) => {
    // Base valuation from investment terms
    const investmentBasedValue = investment > 0 && equityPct > 0 ? (investment / (equityPct / 100)) : 0;
    
    // Growth premium based on sophisticated revenue metrics
    const revenueMetrics = calculateSophisticatedRevenue(customers, agentsPerCustomer, selectedPlan, extraMinutesPerAgent);
    const totalAnnualRevenue = revenueMetrics.annual;
    
    // Growth premium formula:
    // 1. Base multiple of 5x for SaaS companies
    // 2. Additional multiple based on customer count (0.5x for every 100 customers)
    // 3. Cap the additional multiple at 5x
    const baseMultiple = 5;
    const additionalMultiple = Math.min(5, (customers / 100) * 0.5);
    const totalMultiple = baseMultiple + additionalMultiple;
    
    const growthPremium = totalAnnualRevenue * totalMultiple;
    
    return investmentBasedValue + growthPremium;
  }, [agentsPerCustomer, selectedPlan, extraMinutesPerAgent, calculateSophisticatedRevenue]);

  // Current valuation based on investment terms and customer growth
  const currentValuation = calculateCompanyValuation(investmentAmount, equityPercentage, customerCount);

  // Get current sophisticated revenue metrics with subscription mix
  const revenueMetrics = calculateSophisticatedRevenue(customerCount, agentsPerCustomer, selectedPlan, extraMinutesPerAgent, subscriptionMix);
  const revenueMultiple = currentValuation / (revenueMetrics.annual || 1);

  // Get 12-month cashflow timeline
  const cashflowTimeline = calculateCashflowTimeline(monthlyCustomerTargets, agentsPerCustomer, extraMinutesPerAgent, subscriptionMix, monthlyOperatingCosts);
  
  // Find when salaries become affordable
  const salaryAffordableMonth = cashflowTimeline.find(month => month.salaryAffordable)?.month || null;

  // Calculate equity distributions - EXACT 42/42/10/6 STRUCTURE
  const calculateEquityDistribution = useCallback((step: number, investorPct: number) => {
    // EXACT STRUCTURE: 42% Domenico, 42% Michael, 10% Investors, 6% Employees
    let domenico = 42;
    let michael = 42;
    let investors = 10; // Reserved preference shares
    let employees = 6;  // Reserved employee shares
    
    // Show current vs potential structure
    if (investorPct > 0) {
      // When investors come in, they get their 10% allocation
      return [
        { name: 'Domenico', value: 42 },
        { name: 'Michael', value: 42 },
        { name: 'Investors', value: 10 },
        { name: 'Employees', value: 6 }
      ];
    }
    
    // Current structure (only founders have issued shares)
    return [
      { name: 'Domenico', value: 42 },
      { name: 'Michael', value: 42 },
      { name: 'Investors (Reserved)', value: 10 },
      { name: 'Employees (Reserved)', value: 6 }
    ];
  }, []);
  
  useEffect(() => {
    // Animate customer count on initial load
    setAnimateCustomers(true);
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setCustomerCount(prev => {
          const target = currentStep === 0 ? 0 : 
                        currentStep === 1 ? 150 : 
                        currentStep === 2 ? 400 : 
                        currentStep === 3 ? 700 : 1000;
          
          if (prev >= target) {
            clearInterval(interval);
            return target;
          }
          return prev + Math.min(20, target - prev);
        });
      }, 20);
      
      return () => clearInterval(interval);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Customer data for different stages - NEW EQUAL PARTNERSHIP
  const customerStages = [
    { stage: 'Foundation', customers: 0 },
    { stage: 'Growth', customers: 150 },
    { stage: 'Expansion', customers: 400 },
    { stage: 'Scale', customers: 700 },
    { stage: 'Investment', customers: 1000 }
  ];
  
  // Current equity distribution based on step and investor percentage
  const currentEquityDistribution = calculateEquityDistribution(currentStep, 
    currentStep === 4 ? equityPercentage : 0);
  
  // Protection Balance Data
  const protectionData = [
    { subject: 'Board Control', companyScore: 7, founderScore: 8 },
    { subject: 'Share Transfer', companyScore: 8, founderScore: 6 },
    { subject: 'Reserved Matters', companyScore: 6, founderScore: 8 },
    { subject: 'IP Rights', companyScore: 9, founderScore: 7 },
    { subject: 'Non-Compete', companyScore: 8, founderScore: 6 },
    { subject: 'Exit Rights', companyScore: 7, founderScore: 8 }
  ];
  
  // Investor Pool Data
  const investorPoolData = [
    { stage: 'Pre-Investment', shares: 1000000, allocation: 'Reserved' },
    { stage: 'Seed Round', shares: 500000, allocation: 'Available' },
    { stage: 'Series A', shares: 500000, allocation: 'Available' }
  ];
  
  // Custom PieChart active sector animation
  const renderActiveShape = (props: PieChartProps) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      percent,
      value
    } = props;

    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * startAngle);
    const cos = Math.cos(-RADIAN * startAngle);
    const mx = Number(cx) + (outerRadius + 10) * cos;
    const my = Number(cy) + (outerRadius + 10) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={Number(cx)} y={Number(cy)} dy={8} textAnchor="middle" fill={fill}>
          {payload.name}
        </text>
        <Sector
          cx={Number(cx)}
          cy={Number(cy)}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={Number(cx)}
          cy={Number(cy)}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path
          d={`M${mx},${my}L${ex},${ey}`}
          stroke={fill}
          fill="none"
        />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          textAnchor={textAnchor}
          fill="#999"
        >{`${value}%`}</text>
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          dy={18}
          textAnchor={textAnchor}
          fill="#999"
        >
          {`(Rate ${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };

  const onPieEnter = useCallback((event: ChartEvent, index: number) => {
    setActiveIndex(index);
  }, []);
  
  const COLORS = ['#FF9800', '#2196F3', '#4CAF50', '#F44336'];
  
  // KPI milestones and salary structure - EXACT SHA NUMBERS
  const kpiMilestones = [
    {
      title: "Foundation: 42/42/10/6 Structure",
      customers: 0,
      shares: {
        domenico: 5000000,
        michael: 5000000,
        investors: 1190476,
        employees: 714286,
        totalAuthorized: 11904762,
        totalIssued: 10000000
      },
      description: "Domenico (5M shares) and Michael (5M shares) equal partnership. 1.19M preference shares reserved for investors, 714K for employees. Total authorized: 11,904,762 shares."
    },
    {
      title: "KPI Target: 50 Customers in 2 Months",
      customers: 50,
      shares: {
        domenico: 5000000,
        michael: 5000000,
        investors: 1190476,
        employees: 714286,
        totalAuthorized: 11904762,
        totalIssued: 10000000
      },
      description: "Critical KPI: Michael must acquire 50 enterprise customers (min $4K ARR each) by July 31, 2025. Success unlocks $70K annual salary for both founders. Target: $200K total ARR."
    },
    {
      title: "Salary Unlocked: Growth Phase",
      customers: 150,
      shares: {
        domenico: 5000000,
        michael: 5000000,
        investors: 1190476,
        employees: 714286,
        totalAuthorized: 11904762,
        totalIssued: 10000000
      },
      description: "KPI achieved! Both founders now earning $70K annually ($5,833/month each). Continued growth beyond initial 50 customer target. Strong foundation for scaling."
    },
    {
      title: "Scale Phase: Investment Ready",
      customers: 400,
      shares: {
        domenico: 5000000,
        michael: 5000000,
        investors: 1190476,
        employees: 714286,
        totalAuthorized: 11904762,
        totalIssued: 10000000
      },
      description: "Significant customer growth demonstrates product-market fit. 42/42/10/6 structure attractive to investors. Reserved preference shares ready for strategic investors."
    },
    {
      title: "Investment Round: Full Structure",
      customers: 1000,
      shares: {
        domenico: 5000000,
        michael: 5000000,
        investors: 1190476,
        employees: 714286,
        totalAuthorized: 11904762,
        totalIssued: 11904762
      },
      description: "Investment-ready with 1000+ customers. All 11.9M authorized shares issued: 10M voting (founders), 1.19M preference (investors), 714K employee shares. Full structure activated."
    }
  ];
  
  // Leaver Events Data
  const leaverEventsData = [
    { event: 'Good Leaver', shareRetention: 100, compensation: 'Full Market Value' },
    { event: 'Bad Leaver', shareRetention: 20, compensation: 'Nominal Value' },
    { event: 'Intermediate', shareRetention: 60, compensation: 'Fair Value' }
  ];
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Glowing hero section */}
      <div className="relative overflow-hidden py-10 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-purple-900 opacity-70"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              The Augmented 4 Pty Ltd
            </h1>
            <p className="mt-3 max-w-md mx-auto text-lg text-gray-300 sm:text-xl md:mt-5 md:max-w-3xl">
            </p>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex overflow-x-auto py-2 mb-6 border-b border-gray-700">
          <button 
            onClick={() => setActiveTab('gameMode')}
            className={`px-4 py-2 font-medium rounded-t-lg mr-2 ${activeTab === 'gameMode' ? 'bg-blue-900 bg-opacity-50 text-blue-300' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <div className="flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              <span>Interactive Game Mode</span>
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('valuation')}
            className={`px-4 py-2 font-medium rounded-t-lg mr-2 ${activeTab === 'valuation' ? 'bg-blue-900 bg-opacity-50 text-blue-300' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <div className="flex items-center">
              <BarChart2 className="h-4 w-4 mr-2" />
              <span>Valuation Calculator</span>
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('protection')}
            className={`px-4 py-2 font-medium rounded-t-lg mr-2 ${activeTab === 'protection' ? 'bg-blue-900 bg-opacity-50 text-blue-300' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <div className="flex items-center">
              <Lock className="h-4 w-4 mr-2" />
              <span>Protection Balance</span>
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('investor')}
            className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === 'investor' ? 'bg-blue-900 bg-opacity-50 text-blue-300' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <div className="flex items-center">
              <PieChartIcon className="h-4 w-4 mr-2" />
              <span>Investor Pool Analysis</span>
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('leaver')}
            className={`px-4 py-2 font-medium rounded-t-lg mr-2 ${activeTab === 'leaver' ? 'bg-blue-900 bg-opacity-50 text-blue-300' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <div className="flex items-center">
              <Briefcase className="h-4 w-4 mr-2" />
              <span>Leaver Events</span>
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('constitution')}
            className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === 'constitution' ? 'bg-blue-900 bg-opacity-50 text-blue-300' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              <span>Constitution</span>
            </div>
          </button>
        </div>
        
        {/* Active Tab Content */}
        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700">
          {activeTab === 'gameMode' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-300 flex items-center">
                  <Zap className="h-6 w-6 mr-2 text-yellow-400" />
                  KPI Simulation
                </h2>
              </div>
              
              {/* Progress Indicator */}
              <div className="mb-8">
                <div className="flex flex-col md:flex-row justify-between mb-4">
                  <div className="mb-4 md:mb-0">
                    <div className="text-2xl font-bold flex items-center mb-2">
                      <Users className="h-6 w-6 mr-2 text-blue-400" />
                      <span className={`${animateCustomers ? 'text-green-400' : 'text-white'}`}>
                        {customerCount.toLocaleString()}
                      </span>
                      <span className="text-gray-400 ml-2">/ 1,000 Customers</span>
                    </div>
                    <div className="bg-gray-700 h-2 rounded-full w-full max-w-md">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-green-400 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${(customerCount / 1000) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-2xl font-bold flex items-center mb-2">
                      <Award className="h-6 w-6 mr-2 text-yellow-400" />
                      <span className="text-white">
                        {(currentStep === 0 ? 0 : 500000 * currentStep).toLocaleString()}
                      </span>
                      <span className="text-gray-400 ml-2">/ 2,000,000 Shares</span>
                    </div>
                    <div className="bg-gray-700 h-2 rounded-full w-full max-w-md">
                      <div
                        className="bg-gradient-to-r from-yellow-500 to-yellow-300 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${(currentStep * 25)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Step Navigation */}
              <div className="mb-8 bg-gray-900 p-4 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-blue-300">Business Growth Journey</h3>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {customerStages.map((stage, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`px-4 py-2 rounded-lg flex items-center ${
                        currentStep === index 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      } transition-all duration-200`}
                    >
                      <span className="font-medium mr-2">{stage.stage}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-700">{stage.customers}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Main Game UI */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Company Visualization */}
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-xl font-semibold mb-4 text-blue-300">Current Share Distribution</h3>
                  
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          activeIndex={activeIndex}
                          activeShape={renderActiveShape}
                          data={currentEquityDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          dataKey="value"
                          onMouseEnter={onPieEnter}
                        >
                          {currentEquityDistribution.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                              stroke={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="bg-gray-800 rounded-lg p-2 text-center">
                      <p className="text-sm text-gray-400">Domenico</p>
                      <p className="text-lg font-bold text-orange-500">
                        {currentEquityDistribution[0].value}%
                      </p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-2 text-center">
                      <p className="text-sm text-gray-400">Michael</p>
                      <p className="text-lg font-bold text-blue-500">
                        {currentEquityDistribution[1].value}%
                      </p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-2 text-center">
                      <p className="text-sm text-gray-400">Investors</p>
                      <p className="text-lg font-bold text-green-500">
                        {currentEquityDistribution[2].value}%
                      </p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-2 text-center">
                      <p className="text-sm text-gray-400">Employees</p>
                      <p className="text-lg font-bold text-purple-500">
                        {currentEquityDistribution[3] ? currentEquityDistribution[3].value : 6}%
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Current Milestone Description */}
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center mb-4">
                    <Target className="h-6 w-6 mr-2 text-green-400" />
                    <h3 className="text-xl font-semibold text-blue-300">{kpiMilestones[currentStep].title}</h3>
                  </div>
                  
                  <p className="text-gray-300 mb-6">{kpiMilestones[currentStep].description}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h4 className="text-md font-medium text-gray-300 mb-2">Share Structure</h4>
                      <div className="text-center">
                        <p className="text-sm text-gray-400">Total Authorized</p>
                        <p className="text-lg font-bold text-blue-400">
                          {kpiMilestones[currentStep].shares.totalAuthorized.toLocaleString()} shares
                        </p>
                        <p className="text-xs text-gray-500">
                          Issued: {kpiMilestones[currentStep].shares.totalIssued.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h4 className="text-md font-medium text-gray-300 mb-2">Valuation Impact</h4>
                      <p className="text-sm text-gray-400">Company Value</p>
                      <p className="text-lg font-bold text-green-400">
                        ${(currentValuation).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Detailed Share Breakdown */}
                  <div className="bg-blue-900 bg-opacity-30 border border-blue-800 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-blue-300 mb-3">Exact Share Allocation (SHA)</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Domenico:</span>
                        <span className="text-orange-400 font-medium">
                          {kpiMilestones[currentStep].shares.domenico.toLocaleString()} shares
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Michael:</span>
                        <span className="text-blue-400 font-medium">
                          {kpiMilestones[currentStep].shares.michael.toLocaleString()} shares
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Investors (Reserved):</span>
                        <span className="text-green-400 font-medium">
                          {kpiMilestones[currentStep].shares.investors.toLocaleString()} shares
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Employees (Reserved):</span>
                        <span className="text-purple-400 font-medium">
                          {kpiMilestones[currentStep].shares.employees.toLocaleString()} shares
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Milestone specific data */}
                  <div className="bg-blue-900 bg-opacity-30 border border-blue-800 rounded-lg p-4">
                    <h4 className="font-medium text-blue-300 mb-2">Growth Milestones</h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start">
                        <div className={`h-5 w-5 rounded-full mr-2 flex-shrink-0 flex items-center justify-center ${
                          currentStep >= 1 ? 'bg-green-500' : 'bg-gray-600'
                        }`}>
                          {currentStep >= 1 ? (
                            <CheckCircle className="h-3 w-3 text-white" />
                          ) : <span className="text-xs text-white">1</span>}
                        </div>
                        <span>KPI Target: 50 Customers (2 months)</span>
                      </li>
                      <li className="flex items-start">
                        <div className={`h-5 w-5 rounded-full mr-2 flex-shrink-0 flex items-center justify-center ${
                          currentStep >= 2 ? 'bg-green-500' : 'bg-gray-600'
                        }`}>
                          {currentStep >= 2 ? (
                            <CheckCircle className="h-3 w-3 text-white" />
                          ) : <span className="text-xs text-white">2</span>}
                        </div>
                        <span>Salary Unlocked: $70K each annually</span>
                      </li>
                      <li className="flex items-start">
                        <div className={`h-5 w-5 rounded-full mr-2 flex-shrink-0 flex items-center justify-center ${
                          currentStep >= 3 ? 'bg-green-500' : 'bg-gray-600'
                        }`}>
                          {currentStep >= 3 ? (
                            <CheckCircle className="h-3 w-3 text-white" />
                          ) : <span className="text-xs text-white">3</span>}
                        </div>
                        <span>Scale Phase: 400+ Customers</span>
                      </li>
                      <li className="flex items-start">
                        <div className={`h-5 w-5 rounded-full mr-2 flex-shrink-0 flex items-center justify-center ${
                          currentStep >= 4 ? 'bg-green-500' : 'bg-gray-600'
                        }`}>
                          {currentStep >= 4 ? (
                            <CheckCircle className="h-3 w-3 text-white" />
                          ) : <span className="text-xs text-white">4</span>}
                        </div>
                        <span>Investment Ready: 1,000+ Customers</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Timeline View */}
              <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold mb-6 text-blue-300">42/42/10/6 Equity Structure Timeline</h3>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { stage: 'Foundation', Domenico: 42, Michael: 42, Investors: 10, Employees: 6 },
                        { stage: '50 Customers', Domenico: 42, Michael: 42, Investors: 10, Employees: 6 },
                        { stage: 'Salary Unlocked', Domenico: 42, Michael: 42, Investors: 10, Employees: 6 },
                        { stage: 'Scale Phase', Domenico: 42, Michael: 42, Investors: 10, Employees: 6 },
                        { stage: 'Investment', Domenico: 42, Michael: 42, Investors: 10, Employees: 6 }
                      ]}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="stage" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: 'white' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Domenico"
                        stackId="1"
                        stroke="#FF9800"
                        fill="#FF9800"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="Michael"
                        stackId="1"
                        stroke="#2196F3"
                        fill="#2196F3"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="Investors"
                        stackId="1"
                        stroke="#4CAF50"
                        fill="#4CAF50"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="Employees"
                        stackId="1"
                        stroke="#9C27B0"
                        fill="#9C27B0"
                        fillOpacity={0.3}
                      />
                      <Legend />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'valuation' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center mb-4">
                <BarChart2 className="h-6 w-6 mr-2 text-green-400" />
                <h3 className="text-xl font-semibold text-blue-300">Sophisticated Revenue Calculator</h3>
              </div>
              
              {/* Pricing Plans Display */}
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 mb-6">
                <h4 className="text-lg font-medium text-blue-300 mb-4">Pricing Plans</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(pricingPlans).map(([key, plan]) => (
                    <div
                      key={key}
                      className="p-4 rounded-lg border border-gray-600 bg-gray-800"
                    >
                      <div className="text-center">
                        <h5 className="font-bold text-lg text-white mb-1">{plan.name}</h5>
                        <div className="text-2xl font-bold text-green-400 mb-2">
                          AUD ${plan.price}
                        </div>
                        <div className="text-sm text-gray-400 mb-2">per month/agent</div>
                        <div className="text-xs text-gray-500 mb-2">
                          {plan.includedMinutes} minutes included
                        </div>
                        <div className="text-xs text-gray-400">{plan.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Subscription Mix Sliders */}
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 mb-6">
                <h4 className="text-lg font-medium text-blue-300 mb-4">Subscription Mix Distribution</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Base Plan Percentage */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Base Plan ({subscriptionMix.base}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={subscriptionMix.base}
                      onChange={(e) => {
                        const newBase = Number(e.target.value);
                        const remaining = 100 - newBase;
                        const currentTotal = subscriptionMix.premium + subscriptionMix.corporate;
                        
                        if (currentTotal === 0) {
                          // If both premium and corporate are 0, split remaining equally
                          setSubscriptionMix({
                            base: newBase,
                            premium: Math.round(remaining / 2),
                            corporate: remaining - Math.round(remaining / 2)
                          });
                        } else {
                          const premiumRatio = subscriptionMix.premium / currentTotal;
                          setSubscriptionMix({
                            base: newBase,
                            premium: Math.round(remaining * premiumRatio),
                            corporate: Math.round(remaining * (1 - premiumRatio))
                          });
                        }
                      }}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="mt-2 text-center">
                      <div className="text-lg font-bold text-orange-400">
                        {Math.round((customerCount * subscriptionMix.base) / 100)} customers
                      </div>
                      <div className="text-xs text-gray-500">@ $114/agent/month</div>
                    </div>
                  </div>

                  {/* Premium Plan Percentage */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Premium Plan ({subscriptionMix.premium}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={subscriptionMix.premium}
                      onChange={(e) => {
                        const newPremium = Number(e.target.value);
                        const remaining = 100 - newPremium;
                        const currentTotal = subscriptionMix.base + subscriptionMix.corporate;
                        
                        if (currentTotal === 0) {
                          // If both base and corporate are 0, split remaining equally
                          setSubscriptionMix({
                            base: Math.round(remaining / 2),
                            premium: newPremium,
                            corporate: remaining - Math.round(remaining / 2)
                          });
                        } else {
                          const baseRatio = subscriptionMix.base / currentTotal;
                          setSubscriptionMix({
                            base: Math.round(remaining * baseRatio),
                            premium: newPremium,
                            corporate: Math.round(remaining * (1 - baseRatio))
                          });
                        }
                      }}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="mt-2 text-center">
                      <div className="text-lg font-bold text-blue-400">
                        {Math.round((customerCount * subscriptionMix.premium) / 100)} customers
                      </div>
                      <div className="text-xs text-gray-500">@ $163/agent/month</div>
                    </div>
                  </div>

                  {/* Corporate Plan Percentage */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Corporate Plan ({subscriptionMix.corporate}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={subscriptionMix.corporate}
                      onChange={(e) => {
                        const newCorporate = Number(e.target.value);
                        const remaining = 100 - newCorporate;
                        const currentTotal = subscriptionMix.base + subscriptionMix.premium;
                        
                        if (currentTotal === 0) {
                          // If both base and premium are 0, split remaining equally
                          setSubscriptionMix({
                            base: Math.round(remaining / 2),
                            premium: remaining - Math.round(remaining / 2),
                            corporate: newCorporate
                          });
                        } else {
                          const baseRatio = subscriptionMix.base / currentTotal;
                          setSubscriptionMix({
                            base: Math.round(remaining * baseRatio),
                            premium: Math.round(remaining * (1 - baseRatio)),
                            corporate: newCorporate
                          });
                        }
                      }}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                    <div className="mt-2 text-center">
                      <div className="text-lg font-bold text-green-400">
                        {Math.round((customerCount * subscriptionMix.corporate) / 100)} customers
                      </div>
                      <div className="text-xs text-gray-500">@ $327/agent/month</div>
                    </div>
                  </div>
                </div>
                
                {/* Mix Summary */}
                <div className="mt-4 p-4 bg-blue-900 bg-opacity-30 border border-blue-800 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-blue-300 mb-2">Current Mix Distribution</div>
                    <div className="flex justify-center space-x-6 text-sm">
                      <span className="text-orange-400">Base: {subscriptionMix.base}%</span>
                      <span className="text-blue-400">Premium: {subscriptionMix.premium}%</span>
                      <span className="text-green-400">Corporate: {subscriptionMix.corporate}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Main Calculator Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Investment Amount Slider */}
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-medium text-blue-300 mb-4">Investment Amount</h4>
                  <input
                    type="range"
                    min="0"
                    max="10000000"
                    step="100000"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                  <div className="mt-2 text-xl font-bold text-green-400 transition-all duration-500">
                    ${investmentAmount.toLocaleString()}
                  </div>
                </div>

                {/* Customer Count Slider */}
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-medium text-blue-300 mb-4">Customers</h4>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={customerCount}
                    onChange={(e) => {
                      setCustomerCount(Number(e.target.value));
                      setAnimateCustomers(true);
                    }}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="mt-2 text-xl font-bold text-purple-400 transition-all duration-500">
                    {customerCount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Steps: 0, 50, 100, 150... to 1000
                  </div>
                </div>

                {/* Agents per Customer Slider */}
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-medium text-blue-300 mb-4">Agents per Customer</h4>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={agentsPerCustomer}
                    onChange={(e) => setAgentsPerCustomer(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="mt-2 text-xl font-bold text-orange-400 transition-all duration-500">
                    {agentsPerCustomer.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Default: 1.8 agents/customer
                  </div>
                </div>

                {/* Extra Minutes per Agent Slider */}
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-medium text-blue-300 mb-4">Extra Minutes/Agent</h4>
                  <input
                    type="range"
                    min="0"
                    max="720"
                    step="30"
                    value={extraMinutesPerAgent}
                    onChange={(e) => setExtraMinutesPerAgent(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  />
                  <div className="mt-2 text-xl font-bold text-yellow-400 transition-all duration-500">
                    {extraMinutesPerAgent} min
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    @ $0.55 AUD/min | 0-12 hours/month
                  </div>
                </div>
              </div>

              {/* Sophisticated Revenue Results */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {/* Revenue Breakdown */}
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-medium text-blue-300 mb-4">Revenue Breakdown</h4>
                  <div className="space-y-4">
                    {/* Subscription Mix Breakdown */}
                    {revenueMetrics.breakdown && (
                      <>
                        <div className="p-4 bg-gray-800 rounded-lg">
                          <div className="text-sm text-gray-400 mb-3">Subscription Revenue by Plan</div>
                          <div className="grid grid-cols-3 gap-3 text-xs">
                            <div className="text-center">
                              <div className="text-orange-400 font-medium">Base</div>
                              <div className="text-white">{revenueMetrics.breakdown.base.customers} customers</div>
                              <div className="text-orange-400">${revenueMetrics.breakdown.base.revenue.toLocaleString()}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-blue-400 font-medium">Premium</div>
                              <div className="text-white">{revenueMetrics.breakdown.premium.customers} customers</div>
                              <div className="text-blue-400">${revenueMetrics.breakdown.premium.revenue.toLocaleString()}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-green-400 font-medium">Corporate</div>
                              <div className="text-white">{revenueMetrics.breakdown.corporate.customers} customers</div>
                              <div className="text-green-400">${revenueMetrics.breakdown.corporate.revenue.toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-gray-800 rounded-lg">
                          <div className="text-sm text-gray-400">Total Base Subscription</div>
                          <div className="text-xl font-bold text-green-400">
                            ${revenueMetrics.baseMonthly.toLocaleString()}/month
                          </div>
                          <div className="text-xs text-gray-500">
                            Blended across {customerCount} customers
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Fallback for single plan */}
                    {!revenueMetrics.breakdown && (
                      <div className="p-4 bg-gray-800 rounded-lg">
                        <div className="text-sm text-gray-400">Base Subscription</div>
                        <div className="text-xl font-bold text-green-400">
                          ${revenueMetrics.baseMonthly.toLocaleString()}/month
                        </div>
                        <div className="text-xs text-gray-500">
                          {(customerCount * agentsPerCustomer).toFixed(0)} agents × ${pricingPlans[selectedPlan as keyof typeof pricingPlans].price}
                        </div>
                      </div>
                    )}
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-400">Extra Minutes</div>
                      <div className="text-xl font-bold text-yellow-400">
                        ${revenueMetrics.extraMinutesMonthly.toLocaleString()}/month
                      </div>
                      <div className="text-xs text-gray-500">
                        {extraMinutesPerAgent} min/agent × $0.55/min
                      </div>
                    </div>
                    <div className="p-4 bg-blue-900 bg-opacity-30 border border-blue-800 rounded-lg">
                      <div className="text-sm text-blue-300">Total Monthly</div>
                      <div className="text-2xl font-bold text-blue-400">
                        ${revenueMetrics.totalMonthly.toLocaleString()}
                      </div>
                      <div className="text-sm text-blue-300">
                        Annual: ${revenueMetrics.annual.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Valuation */}
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-medium text-blue-300 mb-4">Company Valuation</h4>
                  <div className="text-3xl font-bold text-green-400 mb-4 transition-all duration-500">
                    ${currentValuation.toLocaleString()}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-400">Investment Value</div>
                      <div className="text-lg font-bold text-blue-400">
                        ${investmentAmount > 0 && equityPercentage > 0 ? ((investmentAmount / (equityPercentage / 100))).toLocaleString() : '0'}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-400">Revenue Multiple</div>
                      <div className="text-lg font-bold text-purple-400">
                        {revenueMultiple.toFixed(1)}x
                      </div>
                    </div>
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-400">Per Customer Value</div>
                      <div className="text-lg font-bold text-orange-400">
                        ${customerCount > 0 ? (currentValuation / customerCount).toFixed(0) : '0'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-medium text-blue-300 mb-4">Key Metrics</h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-400">Total Agents</div>
                      <div className="text-xl font-bold text-purple-400">
                        {(customerCount * agentsPerCustomer).toFixed(0)}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-400">Revenue per Agent</div>
                      <div className="text-xl font-bold text-green-400">
                        ${customerCount > 0 ? revenueMetrics.perAgent.toFixed(0) : '0'}/month
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-400">Revenue per Customer</div>
                      <div className="text-xl font-bold text-yellow-400">
                        ${customerCount > 0 ? revenueMetrics.perCustomer.toFixed(0) : '0'}/month
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-400">Plan: {pricingPlans[selectedPlan as keyof typeof pricingPlans].name}</div>
                      <div className="text-lg font-bold text-blue-400">
                        {pricingPlans[selectedPlan as keyof typeof pricingPlans].includedMinutes} min included
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cashflow Timeline Analysis */}
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 mt-6">
                <h4 className="text-lg font-medium text-blue-300 mb-4">12-Month Cashflow Timeline</h4>
                
                {/* Growth Pattern & Operating Costs Controls */}
                <div className="mb-6">
                  <label className="text-sm text-gray-400 mb-3 block">Monthly Customer Acquisition Targets</label>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                    {monthlyCustomerTargets.map((target, index) => (
                      <div key={index} className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">
                          Month {index + 1}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={target}
                          onChange={(e) => {
                            const newTargets = [...monthlyCustomerTargets];
                            newTargets[index] = parseInt(e.target.value) || 0;
                            setMonthlyCustomerTargets(newTargets);
                          }}
                          className="p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="text-gray-400">
                      Total customers by end of year: <span className="text-purple-400 font-bold">{monthlyCustomerTargets.reduce((sum, target) => sum + target, 0)}</span>
                    </div>
                    <div className="text-gray-400">
                      Average per month: <span className="text-blue-400 font-bold">{Math.round(monthlyCustomerTargets.reduce((sum, target) => sum + target, 0) / 12)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-sm text-gray-400 mb-2 block">Monthly Operating Costs (excluding salaries)</label>
                  <input
                    type="range"
                    min="1000"
                    max="20000"
                    step="500"
                    value={monthlyOperatingCosts}
                    onChange={(e) => setMonthlyOperatingCosts(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <div className="mt-2 text-lg font-bold text-red-400">
                    ${monthlyOperatingCosts.toLocaleString()}/month
                  </div>
                </div>

                {/* Salary Affordability Alert */}
                <div className={`p-4 rounded-lg border mb-6 ${
                  salaryAffordableMonth 
                    ? 'bg-green-900 bg-opacity-30 border-green-800' 
                    : 'bg-red-900 bg-opacity-30 border-red-800'
                }`}>
                  <div className="flex items-center">
                    {salaryAffordableMonth ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                        <span className="text-green-300 font-medium">
                          Salaries Affordable from Month {salaryAffordableMonth}
                        </span>
                      </>
                    ) : (
                      <>
                        <Target className="h-5 w-5 text-red-400 mr-2" />
                        <span className="text-red-300 font-medium">
                          Salaries not affordable within 12 months - need more customers or lower costs
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Target: $11,667/month for both founders ($70K each annually)
                  </div>
                </div>

                                 {/* Customer Acquisition Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-80">
                    <h5 className="text-md font-medium text-blue-300 mb-3">Customer Acquisition Timeline</h5>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={cashflowTimeline.map(month => ({
                          week: month.month * 4, // Convert months to weeks
                          customers: month.customers,
                          month: month.month
                        }))}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="customers" 
                          stroke="#9CA3AF"
                          label={{ value: 'Number of Customers', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                        />
                        <YAxis 
                          dataKey="week"
                          stroke="#9CA3AF"
                          label={{ value: 'Weeks', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: 'white' }}
                          formatter={(value: number, name: string) => [
                            name === 'customers' ? `${value} customers` : `Week ${value}`,
                            name === 'customers' ? 'Customers' : 'Timeline'
                          ]}
                          labelFormatter={(label) => `Month ${Math.ceil(label / 4)}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="customers"
                          stroke="#8B5CF6"
                          fill="#8B5CF6"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="h-80">
                    <h5 className="text-md font-medium text-blue-300 mb-3">Monthly Cashflow</h5>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={cashflowTimeline}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: 'white' }}
                          formatter={(value: number, name: string) => [
                            `$${value.toLocaleString()}`,
                            name === 'revenue' ? 'Revenue' :
                            name === 'operatingCosts' ? 'Operating Costs' :
                            name === 'profitBeforeSalaries' ? 'Profit Before Salaries' :
                            name === 'profitAfterSalaries' ? 'Profit After Salaries' : name
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stackId="1"
                          stroke="#10B981"
                          fill="#10B981"
                          fillOpacity={0.3}
                        />
                        <Area
                          type="monotone"
                          dataKey="operatingCosts"
                          stackId="2"
                          stroke="#EF4444"
                          fill="#EF4444"
                          fillOpacity={0.3}
                        />
                        <Area
                          type="monotone"
                          dataKey="profitBeforeSalaries"
                          stackId="3"
                          stroke="#3B82F6"
                          fill="#3B82F6"
                          fillOpacity={0.3}
                        />
                        <Legend />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Monthly Breakdown Table */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-2 text-gray-400">Month</th>
                        <th className="text-right p-2 text-gray-400">New</th>
                        <th className="text-right p-2 text-gray-400">Total</th>
                        <th className="text-right p-2 text-gray-400">Revenue</th>
                        <th className="text-right p-2 text-gray-400">Costs</th>
                        <th className="text-right p-2 text-gray-400">Profit</th>
                        <th className="text-center p-2 text-gray-400">Salary?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashflowTimeline.slice(0, 6).map((month) => (
                        <tr key={month.month} className="border-b border-gray-800">
                          <td className="p-2 text-white">Month {month.month}</td>
                          <td className="p-2 text-right text-yellow-400">+{month.newCustomers}</td>
                          <td className="p-2 text-right text-purple-400">{month.customers}</td>
                          <td className="p-2 text-right text-green-400">${month.revenue.toLocaleString()}</td>
                          <td className="p-2 text-right text-red-400">${month.operatingCosts.toLocaleString()}</td>
                          <td className="p-2 text-right text-blue-400">${month.profitBeforeSalaries.toLocaleString()}</td>
                          <td className="p-2 text-center">
                            {month.salaryAffordable ? (
                              <CheckCircle className="h-4 w-4 text-green-400 mx-auto" />
                            ) : (
                              <span className="text-red-400">✗</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {cashflowTimeline.length > 6 && (
                    <div className="text-center mt-2 text-gray-500 text-xs">
                      Showing first 6 months - full 12-month data in chart above
                    </div>
                  )}
                </div>
              </div>

              {/* Investment Parameters */}
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 mt-6">
                <h4 className="text-lg font-medium text-blue-300 mb-4">Investment Parameters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Equity Offered (%)</label>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      step="0.5"
                      value={equityPercentage}
                      onChange={(e) => setEquityPercentage(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="mt-2 text-xl font-bold text-blue-400">
                      {equityPercentage}%
                    </div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">Implied Valuation</div>
                    <div className="text-xl font-bold text-purple-400">
                      ${investmentAmount > 0 && equityPercentage > 0 ? ((investmentAmount / (equityPercentage / 100))).toLocaleString() : '0'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Based on investment terms only
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'protection' && (
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center mb-4">
                  <Shield className="h-6 w-6 mr-2 text-blue-400" />
                  <h3 className="text-xl font-semibold text-blue-300">Protection Balance Analysis</h3>
                </div>
                <p className="text-gray-400 mb-6">
                  Visualization of protection measures balancing company and founder interests across key dimensions.
                </p>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={150} data={protectionData}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#9CA3AF' }} />
                      <Radar
                        name="Company"
                        dataKey="companyScore"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.3}
                      />
                      <Radar
                        name="Founders"
                        dataKey="founderScore"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.3}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'investor' && (
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center mb-4">
                  <PieChartIcon className="h-6 w-6 mr-2 text-yellow-400" />
                  <h3 className="text-xl font-semibold text-blue-300">Investor Pool Analysis</h3>
                </div>
                <p className="text-gray-400 mb-6">
                  Overview of the 1,000,000 shares (10%) reserved from Domenico's holding for future investors.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {investorPoolData.map((stage) => (
                    <div key={stage.stage} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                      <h4 className="text-lg font-semibold text-white mb-2">{stage.stage}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Shares</span>
                          <span className="text-yellow-400">{stage.shares.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status</span>
                          <span className="text-blue-400">{stage.allocation}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={investorPoolData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="shares"
                      >
                        {investorPoolData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#EAB308', '#3B82F6', '#10B981'][index % 3]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: 'white' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'leaver' && (
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center mb-4">
                  <UserPlus className="h-6 w-6 mr-2 text-purple-400" />
                  <h3 className="text-xl font-semibold text-blue-300">Leaver Events Scenarios</h3>
                </div>
                <p className="text-gray-400 mb-6">
                  Analysis of different leaver scenarios and their impact on share retention and compensation.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {leaverEventsData.map((scenario) => (
                    <div key={scenario.event} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                      <h4 className="text-lg font-semibold text-white mb-2">{scenario.event}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Share Retention</span>
                          <span className="text-green-400">{scenario.shareRetention}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Compensation</span>
                          <span className="text-blue-400">{scenario.compensation}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={leaverEventsData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="event" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: 'white' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="shareRetention"
                        stroke="#8B5CF6"
                        fill="#8B5CF6"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'constitution' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 mr-2 text-blue-400" />
                <h3 className="text-xl font-semibold text-blue-300">Constitution Overview</h3>
              </div>
              
              {/* Constitution Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                  <div className="text-sm text-gray-400">Total Sections</div>
                  <div className="text-2xl font-bold text-blue-400">141</div>
                  <div className="text-xs text-gray-500">Comprehensive provisions</div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                  <div className="text-sm text-gray-400">Adoption Date</div>
                  <div className="text-lg font-bold text-green-400">9 June 2025</div>
                  <div className="text-xs text-gray-500">Special resolution</div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                  <div className="text-sm text-gray-400">Share Classes</div>
                  <div className="text-2xl font-bold text-yellow-400">3</div>
                  <div className="text-xs text-gray-500">Ordinary, Employee, Preference</div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                  <div className="text-sm text-gray-400">Reserved Matters</div>
                  <div className="text-2xl font-bold text-purple-400">12</div>
                  <div className="text-xs text-gray-500">Unanimous approval required</div>
                </div>
              </div>

              {/* Constitution Structure */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                  <h4 className="text-lg font-medium text-blue-300 mb-4">Constitution Structure</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                      <span className="text-gray-300">Part I: Corporate Structure</span>
                      <span className="text-blue-400">16 sections</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                      <span className="text-gray-300">Part II: Share Certificates</span>
                      <span className="text-blue-400">9 sections</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                      <span className="text-gray-300">Part III: Member Meetings</span>
                      <span className="text-blue-400">17 sections</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                      <span className="text-gray-300">Part IV: Proxy & Voting</span>
                      <span className="text-blue-400">19 sections</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                      <span className="text-gray-300">Part V: Directors</span>
                      <span className="text-blue-400">36 sections</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                      <span className="text-gray-300">Parts VI-XII: Governance</span>
                      <span className="text-blue-400">44 sections</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                  <h4 className="text-lg font-medium text-blue-300 mb-4">Best Practice Compliance</h4>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-white font-medium">Corporations Act 2001</div>
                        <div className="text-sm text-gray-400">Full compliance with sections 136, 180-184, 249A-253E</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-white font-medium">ASIC Requirements</div>
                        <div className="text-sm text-gray-400">Proprietary company constitution standards</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-white font-medium">ASX Listing Ready</div>
                        <div className="text-sm text-gray-400">Compatible with ASX Listing Rules</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5" />
                      <div>
                        <div className="text-white font-medium">AI Industry Specific</div>
                        <div className="text-sm text-gray-400">IP protection, data governance, licensing</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share Classes Breakdown */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h4 className="text-lg font-medium text-blue-300 mb-4">Share Classes Structure</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg border border-blue-600">
                    <div className="text-blue-400 font-medium mb-2">Ordinary Shares (Voting)</div>
                    <div className="text-2xl font-bold text-white mb-2">10,000,000</div>
                    <div className="text-sm text-gray-400 mb-2">84% of total shares</div>
                    <div className="text-xs text-gray-500">Founders only - Full voting rights</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg border border-green-600">
                    <div className="text-green-400 font-medium mb-2">Preference Shares</div>
                    <div className="text-2xl font-bold text-white mb-2">1,190,476</div>
                    <div className="text-sm text-gray-400 mb-2">10% of total shares</div>
                    <div className="text-xs text-gray-500">Strategic investors - 8% preference dividend</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg border border-yellow-600">
                    <div className="text-yellow-400 font-medium mb-2">Employee Ordinary</div>
                    <div className="text-2xl font-bold text-white mb-2">714,286</div>
                    <div className="text-sm text-gray-400 mb-2">6% of total shares</div>
                    <div className="text-xs text-gray-500">Employees - Non-voting with vesting</div>
                  </div>
                </div>
              </div>

              {/* Reserved Matters */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h4 className="text-lg font-medium text-blue-300 mb-4">Reserved Matters (Section 98)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center p-2 bg-gray-800 rounded">
                      <Lock className="h-4 w-4 text-red-400 mr-2" />
                      <span className="text-sm text-gray-300">Share capital changes</span>
                    </div>
                    <div className="flex items-center p-2 bg-gray-800 rounded">
                      <Lock className="h-4 w-4 text-red-400 mr-2" />
                      <span className="text-sm text-gray-300">Director appointments/removals</span>
                    </div>
                    <div className="flex items-center p-2 bg-gray-800 rounded">
                      <Lock className="h-4 w-4 text-red-400 mr-2" />
                      <span className="text-sm text-gray-300">Budget approval</span>
                    </div>
                    <div className="flex items-center p-2 bg-gray-800 rounded">
                      <Lock className="h-4 w-4 text-red-400 mr-2" />
                      <span className="text-sm text-gray-300">Major transactions ($100,000+)</span>
                    </div>
                    <div className="flex items-center p-2 bg-gray-800 rounded">
                      <Lock className="h-4 w-4 text-red-400 mr-2" />
                      <span className="text-sm text-gray-300">IP licensing agreements</span>
                    </div>
                    <div className="flex items-center p-2 bg-gray-800 rounded">
                      <Lock className="h-4 w-4 text-red-400 mr-2" />
                      <span className="text-sm text-gray-300">Strategic partnerships</span>
                    </div>
                  </div>
                  <div className="bg-red-900 bg-opacity-30 border border-red-800 rounded-lg p-4">
                    <h5 className="font-medium text-red-300 mb-2">Unanimous Approval Required</h5>
                    <p className="text-sm text-gray-300">
                      All reserved matters require unanimous approval from both directors (Domenico Rutigliano and Michael Scheelhardt), 
                      ensuring balanced decision-making and protecting both founders' interests.
                    </p>
                  </div>
                </div>
              </div>

              {/* Legal Framework */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h4 className="text-lg font-medium text-blue-300 mb-4">Legal Framework Integration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-white mb-3">Shareholders Agreement Alignment</h5>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        <span>Section 8: SHA compliance framework</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        <span>Share transfer restrictions aligned</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        <span>Corporate governance deference</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        <span>Reserved matters consistency</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-white mb-3">Future Investment Ready</h5>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center">
                        <Target className="h-4 w-4 text-blue-400 mr-2" />
                        <span>Preference share framework</span>
                      </div>
                      <div className="flex items-center">
                        <Target className="h-4 w-4 text-blue-400 mr-2" />
                        <span>Employee share ownership plans</span>
                      </div>
                      <div className="flex items-center">
                        <Target className="h-4 w-4 text-blue-400 mr-2" />
                        <span>Due diligence preparation</span>
                      </div>
                      <div className="flex items-center">
                        <Target className="h-4 w-4 text-blue-400 mr-2" />
                        <span>IPO readiness structure</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Corporate Governance Dashboard for The Augmented 4 Pty Ltd</p>
          <p>Shareholders Agreement: 30 May 2025 | Constitution: 9 June 2025</p>
        </div>
      </div>
    </div>
  );
};

export default App;