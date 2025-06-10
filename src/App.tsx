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
  UserPlus,
  Info
} from 'lucide-react';
import Augmented4Logo from './assets/Augmented4_Logo_High_Res.png';

interface PieChartProps {
  cx: number;
  cy: number;
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

interface PieSectorDataItem {
  name: string;
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

interface Timeline {
  month: number;
  newCustomers: number;
  customers: number;
  revenue: number;
  operatingCosts: number;
  profitBeforeSalaries: number;
  salaryAffordable: boolean;
  salaryAmount: number;
  profitAfterSalaries: number;
  cumulativeProfit: number;
}

interface TimelineItem {
  stage: string;
  customers: number;
}

const App = () => {
  const [activeTab, setActiveTab] = useState('gameMode');
  const [animateCustomers, setAnimateCustomers] = useState(false);
  const [currentCustomers, setCurrentCustomers] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [investmentAmount, setInvestmentAmount] = useState(1000000);
  const [equityPercentage, setEquityPercentage] = useState(10);
  const [agentsPerCustomer, setAgentsPerCustomer] = useState(1.8);
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [extraMinutesPerAgent, setExtraMinutesPerAgent] = useState(300);
  const [subscriptionMix, setSubscriptionMix] = useState({
    base: 5,
    premium: 10,
    corporate: 85
  });
  const [monthlyCustomerTargets, setMonthlyCustomerTargets] = useState([
    8, 10, 16, 18, 22, 16, 20, 12, 21, 17, 22, 35
  ]);
  const [operatingCostPct, setOperatingCostPct] = useState(20);
  
  // Pricing plans
  const pricingPlans = {
    base: {
      name: 'Base',
      price: 114, // AUD per month per agent
      description: 'For Individual. Perfect for getting started.'
    },
    premium: {
      name: 'Premium',
      price: 163, // AUD per month per agent
      description: 'For Startups. Most popular for growing teams.'
    },
    corporate: {
      name: 'Corporate',
      price: 327, // AUD per month per agent
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
  const calculateCashflowTimeline = useCallback((monthlyTargets: number[], agentsPerCust: number, extraMins: number, mix: any, costs: number): Timeline[] => {
    const timeline: Timeline[] = [];
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
  const currentValuation = calculateCompanyValuation(investmentAmount, equityPercentage, currentCustomers);

  // Get current sophisticated revenue metrics with subscription mix
  const revenueMetrics = calculateSophisticatedRevenue(currentCustomers, agentsPerCustomer, selectedPlan, extraMinutesPerAgent, subscriptionMix);
  const revenueMultiple = currentValuation / (revenueMetrics.annual || 1);

  // Get 12-month cashflow timeline
  const cashflowTimeline = calculateCashflowTimeline(monthlyCustomerTargets, agentsPerCustomer, extraMinutesPerAgent, subscriptionMix, Math.round((operatingCostPct / 100) * revenueMetrics.totalMonthly));
  
  // Find when salaries become affordable
  const salaryAffordableMonth = cashflowTimeline.find(month => month.salaryAffordable)?.month || null;

  // Calculate equity distributions based on customer count
  const calculateEquityDistribution = useCallback((customers: number) => {
    const totalShares = 11904762; // Total authorized shares
    const domenicoShares = 5000000;
    const michaelShares = 5000000;
    const employeeShares = 714286; // 6% reserved
    
    if (customers === 1000) {
      // Series B: Additional 10% dilution
      const seriesBShares = Math.floor(totalShares * 0.1); // 10% additional dilution
      const newTotal = totalShares + seriesBShares;
      return [
        { name: 'Domenico', value: Math.round((domenicoShares / newTotal) * 100) },
        { name: 'Michael', value: Math.round((michaelShares / newTotal) * 100) },
        { name: 'Series A', value: 10 }, // Original 10%
        { name: 'Series B', value: 10 }, // New 10%
        { name: 'Employees', value: Math.round((employeeShares / newTotal) * 100) }
      ];
    } else if (customers >= 50) {
      // Series A: Initial 10% investment
      return [
        { name: 'Domenico', value: 42 },
        { name: 'Michael', value: 42 },
        { name: 'Series A', value: 10 },
        { name: 'Employees', value: 6 }
      ];
    }
    
    // Initial structure
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
        setCurrentCustomers(prev => {
                    const target = currentStep === 0 ? 0 : 
                          currentStep === 1 ? 50 : 1000;
          
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
  const timeline: TimelineItem[] = [
    { stage: 'Foundation', customers: 0 },
    { stage: 'Series A', customers: 50 },
    { stage: 'Series B', customers: 1000 }
  ];
  
  // Current equity distribution based on customer count
  const currentEquityDistribution = calculateEquityDistribution(currentCustomers);
  
  // Calculate total shares based on customer count
  const getTotalShares = (customers: number) => {
    const baseShares = 11904762;
    if (customers === 1000) {
      return baseShares + Math.floor(baseShares * 0.1); // Add 10% for Series B
    }
    return baseShares;
  };
  
  const totalShares = getTotalShares(currentCustomers);
  const issuedShares = currentCustomers >= 50 ? 10000000 : 0; // Initial shares issued to founders
  
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
  const renderActiveShape = useCallback((props: any) => {
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
  }, []);

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
      title: "Series A: 50 Customers",
      customers: 50,
      shares: {
        domenico: 5000000,
        michael: 5000000,
        investors: 1190476,
        employees: 714286,
        totalAuthorized: 11904762,
        totalIssued: 10000000
      },
      description: "Series A milestone: $1M investment for 10% equity at 50 customers. Both founders maintain equal 42% shares. Target: ARR > AUD 200,000"
    },
    {
      title: "Series B: 1000 Customers",
      customers: 1000,
      shares: {
        domenico: 5000000,
        michael: 5000000,
        seriesA: 1190476,
        seriesB: 1309524,
        employees: 714286,
        totalAuthorized: 13095238,
        totalIssued: 13095238
      },
      description: "Series B milestone: $10M investment at 1000 customers. Post-dilution: Domenico 38%, Michael 38%, Series A 9%, Series B 10%, Employees 5%. Total authorized: 13,095,238 shares."
    }
  ];
  
  // Leaver Events Data
  const leaverEventsData = [
    { event: 'Good Leaver', shareRetention: 100, compensation: 'Full Market Value' },
    { event: 'Bad Leaver', shareRetention: 20, compensation: 'Nominal Value' },
    { event: 'Intermediate', shareRetention: 60, compensation: 'Fair Value' }
  ];
  
  // Calculate investment amount based on customer count
  const calculateInvestmentAmount = useCallback((customers: number) => {
    if (customers === 1000) return 10000000; // $10M at exactly 1000 customers
    if (customers >= 50 && customers < 1000) return 1000000; // $1M at 50-999 customers
    return 0; // $0 for less than 50 customers
  }, []);

  // Effect to update investment amount based on customer count
  useEffect(() => {
    const newInvestmentAmount = calculateInvestmentAmount(currentCustomers);
    setInvestmentAmount(newInvestmentAmount);
  }, [currentCustomers, calculateInvestmentAmount]);

  // Add state for tooltip
  const [showValuationTooltip, setShowValuationTooltip] = useState(false);
  // Add state for revenue multiple tooltip
  const [showRevenueMultipleTooltip, setShowRevenueMultipleTooltip] = useState(false);
  // Add state for per customer value tooltip
  const [showPerCustomerTooltip, setShowPerCustomerTooltip] = useState(false);
  // Add state for landing page valuation tooltip
  const [showLandingValuationTooltip, setShowLandingValuationTooltip] = useState(false);

  // Calculate value per share
  const valuePerShare = totalShares > 0 ? currentValuation / totalShares : 0;

  // Calculate monthly operating costs as a percentage of revenue
  const monthlyOperatingCosts = Math.round((operatingCostPct / 100) * revenueMetrics.totalMonthly);

  // Prepare data for the chart: cumulative customers per month
  const cumulativeCustomersData = monthlyCustomerTargets.reduce<{ month: number; customers: number }[]>((acc, val, idx) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].customers : 0;
    acc.push({ month: idx + 1, customers: prev + val });
    return acc;
  }, []);

  // Add state for scenario toggle
  const [investorScenario, setInvestorScenario] = useState<'seriesA' | 'seriesB'>('seriesA');

  // Pie chart data for each scenario
  const investorPieData = investorScenario === 'seriesA'
    ? [
        { name: 'Domenico', value: 42, color: '#FF9800' },
        { name: 'Michael', value: 42, color: '#2196F3' },
        { name: 'Investors', value: 10, color: '#4CAF50' },
        { name: 'Employees', value: 6, color: '#9C27B0' }
      ]
    : [
        { name: 'Domenico', value: 38, color: '#FF9800' },
        { name: 'Michael', value: 38, color: '#2196F3' },
        { name: 'Series A', value: 9, color: '#4CAF50' },
        { name: 'Series B', value: 10, color: '#00BCD4' },
        { name: 'Employees', value: 5, color: '#9C27B0' }
      ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Black Header with Logo */}
      <header className="w-full bg-black py-6 px-6 flex items-center shadow-lg z-50 relative overflow-hidden">
        {/* Gradient effect on right side */}
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-purple-600 via-blue-500 to-transparent opacity-60 pointer-events-none" />
        <img src={Augmented4Logo} alt="Augmented4 Logo" className="h-20 w-auto relative z-10" />
        <h1 className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl font-bold text-white drop-shadow-[0_0_10px_white] z-10 whitespace-nowrap">
          Corporate Governance Dashboard
        </h1>
      </header>
      
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
            onClick={() => setActiveTab('investor')}
            className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === 'investor' ? 'bg-blue-900 bg-opacity-50 text-blue-300' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <div className="flex items-center">
              <PieChartIcon className="h-4 w-4 mr-2" />
              <span>Investor Exit Scenarios</span>
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
                        {currentCustomers.toLocaleString()}
                      </span>
                      <span className="text-gray-400 ml-2">/ 1,000 Customers</span>
                    </div>
                    <div className="bg-gray-700 h-2 rounded-full w-full max-w-md">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-green-400 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${(currentCustomers / 1000) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-2xl font-bold flex items-center mb-2">
                      <Award className="h-6 w-6 mr-2 text-yellow-400" />
                      <span className="text-white">
                        {currentCustomers >= 50 ? '10,000,000' : '0'}
                      </span>
                      <span className="text-gray-400 ml-2">
                        / {currentCustomers === 1000 ? '13,095,238' : '11,904,762'} Shares
                      </span>
                    </div>
                    <div className="bg-gray-700 h-2 rounded-full w-full max-w-md">
                      <div
                        className="bg-gradient-to-r from-yellow-500 to-yellow-300 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${currentCustomers >= 1000 ? 100 : currentCustomers >= 50 ? 84 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Step Navigation */}
              <div className="mb-8 bg-gray-900 p-4 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-blue-300">Business Growth Journey</h3>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {timeline.map((stage, index) => (
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
                      <PieChart key={currentStep}>
                        <Pie
                          key={currentStep}
                          activeIndex={activeIndex}
                          activeShape={renderActiveShape}
                          data={currentEquityDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          dataKey="value"
                          onMouseEnter={onPieEnter}
                          isAnimationActive={true}
                          animationDuration={800}
                          animationEasing="ease-in-out"
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
                      <h4 className="text-md font-medium text-gray-300 mb-2 flex items-center">
                        Valuation Impact
                        <span
                          className="ml-1 relative cursor-pointer"
                          onMouseEnter={() => setShowLandingValuationTooltip(true)}
                          onMouseLeave={() => setShowLandingValuationTooltip(false)}
                          onClick={() => setShowLandingValuationTooltip((v) => !v)}
                        >
                          <Info className="h-4 w-4 text-green-400" />
                          {showLandingValuationTooltip && (
                            <div className="absolute left-1/2 top-[120%] z-10 max-w-xs p-4 bg-gray-900 border border-green-400 rounded-lg shadow-xl text-xs text-gray-200" style={{ transform: 'translateX(-50%)' }}>
                              <div className="font-bold mb-1">Valuation Formula</div>
                              <div className="mb-1">Company Value = Investment-based Value + Growth Premium</div>
                              <div className="mb-1">= ({investmentAmount > 0 && equityPercentage > 0 ? `$${investmentAmount.toLocaleString()} / ${equityPercentage}%` : '$0'}) + (Annual Revenue × Multiple)</div>
                              <div className="mb-1">= ({investmentAmount > 0 && equityPercentage > 0 ? `$${(investmentAmount / (equityPercentage / 100)).toLocaleString()}` : '$0'}) + (${revenueMetrics.annual.toLocaleString()} × {((currentCustomers / 100) * 0.5 + 5).toFixed(2)})</div>
                              <div className="mt-2">Current Value: <span className="font-bold text-green-400">${currentValuation.toLocaleString()}</span></div>
                            </div>
                          )}
                        </span>
                      </h4>
                      <p className="text-sm text-gray-400">Company Value</p>
                      <p className="text-lg font-bold text-green-400">
                        ${(currentValuation).toLocaleString()}
                      </p>
                      <div className="mt-2 text-sm text-amber-400 font-semibold">
                        Value per Share: {valuePerShare > 0 ? `$${valuePerShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Detailed Share Breakdown */}
                  <div className="bg-blue-900 bg-opacity-30 border border-blue-800 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-blue-300 mb-3">Exact Share Allocation (SHA)</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Domenico:</span>
                        <span className="text-orange-400 font-medium">
                          {kpiMilestones[currentStep].shares?.domenico?.toLocaleString()} shares
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Michael:</span>
                        <span className="text-blue-400 font-medium">
                          {kpiMilestones[currentStep].shares?.michael?.toLocaleString()} shares
                        </span>
                      </div>
                      {currentStep === 2 ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Series A:</span>
                            <span className="text-green-400 font-medium">
                              {kpiMilestones[2].shares?.seriesA?.toLocaleString()} shares
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Series B:</span>
                            <span className="text-cyan-400 font-medium">
                              {kpiMilestones[2].shares?.seriesB?.toLocaleString()} shares
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-gray-300">Investors (Reserved):</span>
                          <span className="text-green-400 font-medium">
                            {kpiMilestones[currentStep].shares?.investors?.toLocaleString()} shares
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-300">Employees (Reserved):</span>
                        <span className="text-purple-400 font-medium">
                          {kpiMilestones[currentStep].shares?.employees?.toLocaleString()} shares
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
                        <span>Series A: 50 Customers ($1M for 10%)</span>
                      </li>
                      <li className="flex items-start">
                        <div className={`h-5 w-5 rounded-full mr-2 flex-shrink-0 flex items-center justify-center ${
                          currentStep >= 2 ? 'bg-green-500' : 'bg-gray-600'
                        }`}>
                          {currentStep >= 2 ? (
                            <CheckCircle className="h-3 w-3 text-white" />
                          ) : <span className="text-xs text-white">2</span>}
                        </div>
                        <span>Series B: 1,000 Customers ($10M investment)</span>
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
                        { stage: 'Foundation', Domenico: 42, Michael: 42, "Investors (Reserved)": 10, "Employees (Reserved)": 6 },
                        { stage: 'Series A (50)', Domenico: 42, Michael: 42, "Series A": 10, Employees: 6 },
                        { stage: 'Series B (1000)', Domenico: 38, Michael: 38, "Series A": 9, "Series B": 10, Employees: 5 }
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
                        dataKey="Investors (Reserved)"
                        stackId="1"
                        stroke="#4CAF50"
                        fill="#4CAF50"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="Series A"
                        stackId="1"
                        stroke="#4CAF50"
                        fill="#4CAF50"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="Series B"
                        stackId="1"
                        stroke="#00BCD4"
                        fill="#00BCD4"
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
                      <Area
                        type="monotone"
                        dataKey="Employees (Reserved)"
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
                        {Math.round((currentCustomers * subscriptionMix.base) / 100)} customers
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
                        {Math.round((currentCustomers * subscriptionMix.premium) / 100)} customers
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
                        {Math.round((currentCustomers * subscriptionMix.corporate) / 100)} customers
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
                    disabled
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-not-allowed accent-green-500 opacity-50"
                  />
                  <div className="mt-2 text-xl font-bold text-green-400 transition-all duration-500">
                    ${investmentAmount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {currentCustomers < 50 ? "Series A ($1M) available at 50 customers" :
                     currentCustomers < 1000 ? "Series A: $1M investment active" :
                     currentCustomers === 1000 ? "Series B: $10M investment achieved" :
                     "Series B requires exactly 1000 customers"}
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
                    value={currentCustomers}
                    onChange={(e) => {
                      setCurrentCustomers(Number(e.target.value));
                      setAnimateCustomers(true);
                    }}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="mt-2 text-xl font-bold text-purple-400 transition-all duration-500">
                    {currentCustomers.toLocaleString()}
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
                            Blended across {currentCustomers} customers
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
                          {(currentCustomers * agentsPerCustomer).toFixed(0)} agents × ${pricingPlans[selectedPlan as keyof typeof pricingPlans].price}
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
                  <div className="text-lg font-medium text-blue-300 mb-4 flex items-center">
                    Company Valuation
                    <span
                      className="ml-2 relative cursor-pointer"
                      onMouseEnter={() => setShowValuationTooltip(true)}
                      onMouseLeave={() => setShowValuationTooltip(false)}
                      onClick={() => setShowValuationTooltip((v) => !v)}
                    >
                      <Info className="h-5 w-5 text-blue-400" />
                      {showValuationTooltip && (
                        <div className="absolute left-1/2 top-[120%] z-10 max-w-xs p-4 bg-gray-900 border border-blue-400 rounded-lg shadow-xl text-xs text-gray-200" style={{ transform: 'translateX(-50%)' }}>
                          <div className="font-bold mb-1">Valuation Formula</div>
                          <div className="mb-1">Company Value = Investment-based Value + Growth Premium</div>
                          <div className="mb-1">= ({investmentAmount > 0 && equityPercentage > 0 ? `$${investmentAmount.toLocaleString()} / ${equityPercentage}%` : '$0'}) + (Annual Revenue × Multiple)</div>
                          <div className="mb-1">= ({investmentAmount > 0 && equityPercentage > 0 ? `$${(investmentAmount / (equityPercentage / 100)).toLocaleString()}` : '$0'}) + (${revenueMetrics.annual.toLocaleString()} × {((currentCustomers / 100) * 0.5 + 5).toFixed(2)})</div>
                          <div className="mt-2">Current Value: <span className="font-bold text-green-400">${currentValuation.toLocaleString()}</span></div>
                        </div>
                      )}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-green-400 mb-4 transition-all duration-500">
                    ${(currentValuation).toLocaleString()}
                  </div>
                  <div className="text-md text-amber-400 font-semibold mt-2">
                    Value per Share: {valuePerShare > 0 ? `$${valuePerShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-400">Investment Value</div>
                      {currentCustomers >= 50 && (
                        <div className="text-lg font-bold text-blue-400">
                          Series A: $1,000,000
                        </div>
                      )}
                      {currentCustomers === 1000 && (
                        <div className="text-lg font-bold text-blue-400 mt-1">
                          Series B: $10,000,000
                        </div>
                      )}
                      {currentCustomers < 50 && (
                        <div className="text-lg font-bold text-blue-400">
                          $0
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-400 flex items-center">
                        Revenue Multiple
                        <span
                          className="ml-1 relative cursor-pointer"
                          onMouseEnter={() => setShowRevenueMultipleTooltip(true)}
                          onMouseLeave={() => setShowRevenueMultipleTooltip(false)}
                          onClick={() => setShowRevenueMultipleTooltip((v) => !v)}
                        >
                          <Info className="h-4 w-4 text-purple-400" />
                          {showRevenueMultipleTooltip && (
                            <div className="absolute left-1/2 top-[120%] z-10 max-w-xs p-4 bg-gray-900 border border-purple-400 rounded-lg shadow-xl text-xs text-gray-200" style={{ transform: 'translateX(-50%)' }}>
                              <div className="font-bold mb-1">Revenue Multiple Formula</div>
                              <div className="mb-1">Revenue Multiple = Company Value / Annual Revenue</div>
                              <div className="mb-1">= ${currentValuation.toLocaleString()} / ${revenueMetrics.annual.toLocaleString()}</div>
                              <div className="mt-2">Current Multiple: <span className="font-bold text-purple-400">{revenueMultiple.toFixed(1)}x</span></div>
                            </div>
                          )}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-purple-400">
                        {revenueMultiple.toFixed(1)}x
                      </div>
                    </div>
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-400 flex items-center">
                        Per Customer Value
                        <span
                          className="ml-1 relative cursor-pointer"
                          onMouseEnter={() => setShowPerCustomerTooltip(true)}
                          onMouseLeave={() => setShowPerCustomerTooltip(false)}
                          onClick={() => setShowPerCustomerTooltip((v) => !v)}
                        >
                          <Info className="h-4 w-4 text-orange-400" />
                          {showPerCustomerTooltip && (
                            <div className="absolute left-1/2 top-[120%] z-10 max-w-xs p-4 bg-gray-900 border border-orange-400 rounded-lg shadow-xl text-xs text-gray-200" style={{ transform: 'translateX(-50%)' }}>
                              <div className="font-bold mb-1">Per Customer Value Formula</div>
                              <div className="mb-1">Per Customer Value = Company Value / Customer Count</div>
                              <div className="mb-1">= ${currentValuation.toLocaleString()} / {currentCustomers.toLocaleString()}</div>
                              <div className="mt-2">Current Value: <span className="font-bold text-orange-400">{currentCustomers > 0 ? `$${Number((currentValuation / currentCustomers).toFixed(0)).toLocaleString()}` : '0'}</span></div>
                            </div>
                          )}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-orange-400">
                        {currentCustomers > 0 ? `$${Number((currentValuation / currentCustomers).toFixed(0)).toLocaleString()}` : '0'}
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
                        {(currentCustomers * agentsPerCustomer).toFixed(0)}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-400">Revenue per Agent</div>
                      <div className="text-xl font-bold text-green-400">
                        ${currentCustomers > 0 ? revenueMetrics.perAgent.toFixed(0) : '0'}/month
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-400">Revenue per Customer</div>
                      <div className="text-xl font-bold text-yellow-400">
                        ${currentCustomers > 0 ? revenueMetrics.perCustomer.toFixed(0) : '0'}/month
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-400">Selected Plan</div>
                      <div className="text-lg font-bold text-blue-400">
                        {pricingPlans[selectedPlan as keyof typeof pricingPlans].name}
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
                    min="0"
                    max="50"
                    step="1"
                    value={operatingCostPct}
                    onChange={(e) => setOperatingCostPct(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <div className="mt-2 text-lg font-bold text-red-400">
                    {operatingCostPct}% of revenue = ${monthlyOperatingCosts.toLocaleString()}/month
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
                        data={cumulativeCustomersData}
                        margin={{ top: 20, right: 30, left: 30, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="month"
                          stroke="#9CA3AF"
                          label={{ value: 'Month', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                          tick={{ fontSize: 12 }}
                          interval={0}
                          allowDataOverflow={false}
                          domain={[1, 12]}
                          type="number"
                        />
                        <YAxis
                          dataKey="customers"
                          stroke="#9CA3AF"
                          label={{ value: 'Cumulative Customers', angle: -90, position: 'insideLeft', offset: 10, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                          tick={{ fontSize: 12 }}
                          allowDataOverflow={false}
                        />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: 'white' }} />
                        <Area
                          type="monotone"
                          dataKey="customers"
                          stroke="#a78bfa"
                          fill="#a78bfa"
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


            </div>
          )}
          
          {activeTab === 'investor' && (
            <div className="p-6 space-y-6">
              <div className="bg-gray-900 p-8 rounded-3xl border-2 border-blue-800 shadow-2xl mb-6">
                <h3 className="text-2xl font-bold text-blue-300 mb-4">
                  Series A Exit Scenario <span className="text-white">({currentCustomers.toLocaleString()} Customers)</span>
                </h3>
                <div className="text-lg text-white mb-4">
                  If the company is valued at <span className="text-4xl font-extrabold text-emerald-400">${currentValuation.toLocaleString()}</span> at <span className="text-blue-200 font-bold">{currentCustomers.toLocaleString()}</span> customers:
                </div>
                <div className="text-xl text-amber-400 font-bold mb-2">
                  Series A 10% stake: <span className="text-3xl">${(currentValuation * 0.10).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="text-lg text-blue-400 font-bold mb-2">
                  Entry price per share: <span className="text-2xl">${(1000000 / 1190476).toFixed(2)}</span>
                </div>
                <div className="text-lg text-amber-400 font-bold mb-2">
                  Exit price per share: <span className="text-2xl">${valuePerShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {/* Percentage increase in share value */}
                <div className="text-lg text-green-400 font-bold mb-2">
                  Share value increase: <span className="text-2xl">{`${(((valuePerShare - (1000000 / 1190476)) / (1000000 / 1190476)) * 100).toFixed(2)}%`}</span>
                </div>
                <div className="text-base text-gray-400 mt-6">
                  <span className="italic">Note:</span> Actual exit value may be higher or lower depending on the average number of agents per customer and minutes sold per agent.
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center mb-4">
                  <PieChartIcon className="h-6 w-6 mr-2 text-yellow-400" />
                  <h3 className="text-xl font-semibold text-blue-300">Investor Pool Analysis</h3>
                </div>
                <p className="text-gray-400 mb-6">
                  Overview of the 1,190,476 shares (10% of authorized capital) reserved by the company for future external investors. These shares are issued as new shares, diluting all existing shareholders proportionally.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {/* Investor Pool Card */}
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-lg font-semibold text-white mb-2">Investor Pool</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Shares</span>
                        <span className="text-yellow-400">1,190,476</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status</span>
                        <span className="text-blue-400">Authorized for future external investors</span>
                      </div>
                    </div>
                  </div>
                  {/* Series A Card */}
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-lg font-semibold text-white mb-2">Series A</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Shares Issued</span>
                        <span className="text-yellow-400">1,190,476</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status</span>
                        <span className="text-blue-400">Issued at Series A (diluting all existing shareholders)</span>
                      </div>
                    </div>
                  </div>
                  {/* Series B Card */}
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-lg font-semibold text-white mb-2">Series B</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Shares Issued</span>
                        <span className="text-yellow-400">1,323,809</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status</span>
                        <span className="text-blue-400">Issued at Series B (further dilution)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scenario Toggle */}
                <div className="flex justify-center mb-4">
                  <button
                    className={`px-4 py-2 rounded-l-lg font-semibold border border-blue-500 focus:outline-none transition-colors duration-200 ${investorScenario === 'seriesA' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-blue-300'}`}
                    onClick={() => setInvestorScenario('seriesA')}
                  >
                    Series A
                  </button>
                  <button
                    className={`px-4 py-2 rounded-r-lg font-semibold border border-blue-500 border-l-0 focus:outline-none transition-colors duration-200 ${investorScenario === 'seriesB' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-blue-300'}`}
                    onClick={() => setInvestorScenario('seriesB')}
                  >
                    Series B
                  </button>
                </div>

                {/* Dynamic Pie Chart */}
                <div className="h-64 flex flex-col items-center justify-center">
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie
                        data={investorPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        isAnimationActive={true}
                        animationDuration={800}
                        animationEasing="ease-in-out"
                      >
                        {investorPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => [`${value}%`, props.payload.name]}
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: 'white' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Custom Legend */}
                  <div className="flex justify-center mt-4 space-x-6">
                    {investorPieData.map((entry, idx) => (
                      <div key={entry.name} className="flex items-center space-x-2">
                        <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: entry.color }}></span>
                        <span className="text-sm text-gray-200">{entry.name} ({entry.value}%)</span>
                      </div>
                    ))}
                  </div>
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